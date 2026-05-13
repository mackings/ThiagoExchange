package giftcards

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"thiagoxchange/backend/internal/features/auth"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrInvalidGiftCard = errors.New("select a gift card type")
	ErrInvalidAmount   = errors.New("enter a valid gift card amount")
	ErrInvalidPayout   = errors.New("select a payout method")
	ErrOrderNotFound   = errors.New("gift card order not found")
	ErrForbidden       = errors.New("forbidden")
)

type Service struct {
	repo   *Repository
	client *PrestmitClient
}

func NewService(repo *Repository, client *PrestmitClient) *Service {
	return &Service{repo: repo, client: client}
}

func (s *Service) Config(ctx context.Context) (Config, error) {
	return s.client.RateCalculatorData(ctx)
}

func (s *Service) Submit(ctx context.Context, user auth.User, input SubmitInput) (Order, error) {
	if input.GiftCardID <= 0 {
		return Order{}, ErrInvalidGiftCard
	}
	if input.Amount <= 0 {
		return Order{}, ErrInvalidAmount
	}
	if strings.TrimSpace(input.PayoutMethod) == "" {
		input.PayoutMethod = "NAIRA"
	}
	now := time.Now()
	order := Order{
		UserID: user.ID, UserName: user.Name, UserEmail: user.Email,
		GiftCardID: input.GiftCardID, GiftCardName: strings.TrimSpace(input.GiftCardName), CategoryName: strings.TrimSpace(input.CategoryName),
		Amount: input.Amount, PayoutMethod: strings.TrimSpace(input.PayoutMethod), PayoutAddress: strings.TrimSpace(input.PayoutAddress),
		CardCodeMasked: maskSecret(input.CardCode), PINMasked: maskSecret(input.PIN), AttachmentCount: len(input.Attachments),
		Provider: "prestmit", Status: StatusPending, ProviderStatus: "PENDING", CreatedAt: now, UpdatedAt: now,
	}
	created, err := s.repo.Create(ctx, order)
	if err != nil {
		return Order{}, err
	}

	raw, err := s.client.CreateSellTrade(ctx, input, fmt.Sprintf("%s:%s", user.ID.Hex(), created.ID.Hex()))
	if err != nil {
		status := StatusFailed
		message := err.Error()
		if errors.Is(err, ErrPrestmitNotConfigured) {
			message = "Prestmit credentials are not configured on the server."
		}
		_ = s.repo.UpdateProvider(ctx, created.ID, status, "FAILED", message, "", nil)
		created.Status = status
		created.ProviderStatus = "FAILED"
		created.ProviderMessage = message
		return created, err
	}
	tradeRaw := extractTrade(raw)
	reference := stringFromAny(tradeRaw["reference"])
	providerStatus := strings.ToUpper(stringFromAny(tradeRaw["status"]))
	if providerStatus == "" {
		providerStatus = "PENDING"
	}
	status := mapProviderStatus(providerStatus)
	created.Rate = numberFromAny(tradeRaw["rate"])
	created.ExpectedPayoutNGN = numberFromAny(tradeRaw["totalAmount"])
	created.ProviderReference = reference
	created.ProviderStatus = providerStatus
	created.ProviderMessage = stringFromAny(raw["details"])
	created.Status = status
	created.RawProviderTrade = tradeRaw
	created.UpdatedAt = time.Now()
	_ = s.repo.UpdateProvider(ctx, created.ID, status, providerStatus, created.ProviderMessage, reference, tradeRaw)
	return created, nil
}

func (s *Service) List(ctx context.Context, user auth.User, all bool) ([]Order, error) {
	filter := bson.M{"userId": user.ID}
	if all && user.Role == auth.RoleAdmin {
		filter = bson.M{}
	}
	return s.repo.List(ctx, filter)
}

func (s *Service) Get(ctx context.Context, user auth.User, orderID string) (Order, error) {
	order, err := s.findAuthorized(ctx, user, orderID)
	if err != nil {
		return Order{}, err
	}
	return order, nil
}

func (s *Service) Refresh(ctx context.Context, user auth.User, orderID string) (Order, error) {
	order, err := s.findAuthorized(ctx, user, orderID)
	if err != nil {
		return Order{}, err
	}
	if order.ProviderReference == "" {
		return order, nil
	}
	raw, err := s.client.SellHistory(ctx, 1)
	if err != nil {
		return order, err
	}
	if match := findHistoryTrade(raw, order.ProviderReference); match != nil {
		providerStatus := strings.ToUpper(stringFromAny(match["status"]))
		status := mapProviderStatus(providerStatus)
		message := stringFromAny(match["rejectionReason"])
		if message == "" {
			message = stringFromAny(match["details"])
		}
		if err := s.repo.UpdateProvider(ctx, order.ID, status, providerStatus, message, order.ProviderReference, match); err != nil {
			return order, err
		}
		order.Status = status
		order.ProviderStatus = providerStatus
		order.ProviderMessage = message
		order.RawProviderTrade = match
		order.UpdatedAt = time.Now()
	}
	return order, nil
}

func (s *Service) findAuthorized(ctx context.Context, user auth.User, orderID string) (Order, error) {
	id, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return Order{}, ErrOrderNotFound
	}
	order, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return Order{}, ErrOrderNotFound
	}
	if user.Role != auth.RoleAdmin && order.UserID != user.ID {
		return Order{}, ErrForbidden
	}
	return order, nil
}

func maskSecret(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if len(value) <= 4 {
		return strings.Repeat("*", len(value))
	}
	return strings.Repeat("*", len(value)-4) + value[len(value)-4:]
}

func extractTrade(raw map[string]any) map[string]any {
	data := unwrapDetails(raw)
	if trade, ok := data["trade"].(map[string]any); ok {
		return trade
	}
	return data
}

func mapProviderStatus(status string) string {
	switch strings.ToUpper(status) {
	case "COMPLETED", "SUCCESS", "SUCCESSFUL":
		return StatusCompleted
	case "REJECTED", "DECLINED", "FAILED":
		return StatusRejected
	case "PENDING", "PROCESSING", "":
		return StatusSubmitted
	default:
		return StatusSubmitted
	}
}

func stringFromAny(value any) string {
	switch typed := value.(type) {
	case string:
		return typed
	case fmt.Stringer:
		return typed.String()
	default:
		if value == nil {
			return ""
		}
		return fmt.Sprint(value)
	}
}

func numberFromAny(value any) float64 {
	switch typed := value.(type) {
	case float64:
		return typed
	case float32:
		return float64(typed)
	case int:
		return float64(typed)
	case int64:
		return float64(typed)
	case string:
		var out float64
		_, _ = fmt.Sscanf(typed, "%f", &out)
		return out
	default:
		return 0
	}
}

func findHistoryTrade(raw map[string]any, reference string) map[string]any {
	for _, item := range flatten(raw) {
		if stringFromAny(item["reference"]) == reference {
			return item
		}
	}
	return nil
}

func flatten(value any) []map[string]any {
	out := []map[string]any{}
	switch typed := value.(type) {
	case []any:
		for _, item := range typed {
			out = append(out, flatten(item)...)
		}
	case map[string]any:
		if _, hasReference := typed["reference"]; hasReference {
			out = append(out, typed)
		}
		for _, item := range typed {
			out = append(out, flatten(item)...)
		}
	}
	return out
}
