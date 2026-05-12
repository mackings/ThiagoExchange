package trades

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"thiagoxchange/backend/internal/features/auth"
	"thiagoxchange/backend/internal/features/rates"
	"thiagoxchange/backend/internal/platform/mailer"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrInvalidRate     = errors.New("invalid rate")
	ErrRateNotFound    = errors.New("rate not found")
	ErrAmountTooLow    = errors.New("amount is below the minimum trade size")
	ErrTradeNotFound   = errors.New("trade not found")
	ErrForbidden       = errors.New("forbidden")
	ErrInvalidStatus   = errors.New("invalid status")
	ErrInvalidHash     = errors.New("transaction hash is required")
	ErrInvalidMessage  = errors.New("message is required")
	ErrTradeNotPending = errors.New("only pending trades can be updated")
)

type Service struct {
	trades *Repository
	rates  *rates.Repository
	mailer mailer.Mailer
}

func NewService(trades *Repository, rates *rates.Repository, mailer mailer.Mailer) *Service {
	return &Service{trades: trades, rates: rates, mailer: mailer}
}

func (s *Service) Create(ctx context.Context, user auth.User, rateID string, amountUSD float64, bank, accountName, accountNumber string) (Trade, error) {
	id, err := primitive.ObjectIDFromHex(rateID)
	if err != nil {
		return Trade{}, ErrInvalidRate
	}
	selected, err := s.rates.FindActiveByID(ctx, id)
	if err != nil {
		return Trade{}, ErrRateNotFound
	}
	if amountUSD < selected.MinAmountUSD {
		return Trade{}, ErrAmountTooLow
	}
	now := time.Now()
	messages := []Message{
		{
			ID:        primitive.NewObjectID(),
			Sender:    "system",
			Body:      fmt.Sprintf("Hello %s, welcome to Thiago Exchange. I hope you are fine. Your %s trade is open and secured for 30 minutes.", user.Name, selected.Coin),
			CreatedAt: now,
		},
		{
			ID:        primitive.NewObjectID(),
			Sender:    "system",
			Body:      fmt.Sprintf("Please release exactly $%.2f worth of %s on %s to this wallet: %s", amountUSD, selected.Coin, selected.Network, selected.WalletAddress),
			CreatedAt: now.Add(time.Second),
		},
		{
			ID:        primitive.NewObjectID(),
			Sender:    "system",
			Body:      "Once you have released the coin, tap 'I have released coin' and upload a screenshot if available. Then send your bank name, account number, and account name so we can pay immediately after confirmation.",
			CreatedAt: now.Add(2 * time.Second),
		},
	}
	trade, err := s.trades.Create(ctx, Trade{
		UserID: user.ID, UserName: user.Name, UserEmail: user.Email, Coin: selected.Coin, Network: selected.Network,
		AmountUSD: amountUSD, RateNGN: selected.BuyRateNGN, ExpectedNGN: amountUSD * selected.BuyRateNGN,
		WalletAddress: selected.WalletAddress, PaymentBank: bank, AccountName: accountName, AccountNumber: accountNumber,
		Status: StatusPending, Messages: messages, CreatedAt: now, ExpiresAt: now.Add(30 * time.Minute),
	})
	if err != nil {
		return Trade{}, err
	}
	_ = s.mailer.Send(user.Email, "Trade opened on Thiago Exchange", fmt.Sprintf("Your %s trade for $%.2f is open for 30 minutes.\nSend to: %s", trade.Coin, trade.AmountUSD, trade.WalletAddress))
	return trade, nil
}

func (s *Service) AddMessage(ctx context.Context, user auth.User, tradeID, body, attachmentURL string) (Trade, error) {
	body = strings.TrimSpace(body)
	attachmentURL = strings.TrimSpace(attachmentURL)
	if body == "" && attachmentURL == "" {
		return Trade{}, ErrInvalidMessage
	}
	trade, err := s.findAuthorized(ctx, user, tradeID)
	if err != nil {
		return Trade{}, err
	}
	if trade.Status != StatusPending && trade.Status != StatusConfirmed {
		return Trade{}, ErrTradeNotPending
	}
	sender := "user"
	if user.Role == auth.RoleAdmin {
		sender = "admin"
	}
	message := Message{ID: primitive.NewObjectID(), Sender: sender, Body: body, AttachmentURL: attachmentURL, CreatedAt: time.Now()}
	if err := s.trades.AddMessage(ctx, trade.ID, message); err != nil {
		return Trade{}, err
	}
	trade.Messages = append(trade.Messages, message)
	return trade, nil
}

func (s *Service) Cancel(ctx context.Context, user auth.User, tradeID string) (Trade, error) {
	trade, err := s.findAuthorized(ctx, user, tradeID)
	if err != nil {
		return Trade{}, err
	}
	if trade.Status != StatusPending {
		return Trade{}, ErrTradeNotPending
	}
	note := "Trade cancelled by user."
	if user.Role == auth.RoleAdmin {
		note = "Trade cancelled by admin."
	}
	if err := s.trades.SetStatus(ctx, trade.ID, StatusCancelled, note); err != nil {
		return Trade{}, err
	}
	message := Message{ID: primitive.NewObjectID(), Sender: "system", Body: note, CreatedAt: time.Now()}
	_ = s.trades.AddMessage(ctx, trade.ID, message)
	trade.Status = StatusCancelled
	trade.ReceiptNote = note
	trade.Messages = append(trade.Messages, message)
	return trade, nil
}

func (s *Service) List(ctx context.Context, user auth.User, all bool) ([]Trade, error) {
	_ = s.trades.ExpirePending(ctx)
	filter := bson.M{"userId": user.ID}
	if all && user.Role == auth.RoleAdmin {
		filter = bson.M{}
	}
	return s.trades.List(ctx, filter)
}

func (s *Service) Get(ctx context.Context, user auth.User, tradeID string) (Trade, error) {
	_ = s.trades.ExpirePending(ctx)
	trade, err := s.findAuthorized(ctx, user, tradeID)
	if err != nil {
		return Trade{}, err
	}
	return trade, nil
}

func (s *Service) AddHash(ctx context.Context, user auth.User, tradeID, hash string) (Trade, error) {
	hash = strings.TrimSpace(hash)
	if hash == "" {
		return Trade{}, ErrInvalidHash
	}
	trade, err := s.findAuthorized(ctx, user, tradeID)
	if err != nil {
		return Trade{}, err
	}
	if trade.Status != StatusPending {
		return Trade{}, ErrTradeNotPending
	}
	if err := s.trades.SetHash(ctx, trade.ID, hash); err != nil {
		return Trade{}, err
	}
	message := Message{ID: primitive.NewObjectID(), Sender: "user", Body: "I have released the coin. Transaction hash: " + hash, CreatedAt: time.Now()}
	_ = s.trades.AddMessage(ctx, trade.ID, message)
	trade.TransactionHash = hash
	trade.Messages = append(trade.Messages, message)
	return trade, nil
}

func (s *Service) SetStatus(ctx context.Context, tradeID, status, note string) (Trade, error) {
	if !map[string]bool{StatusConfirmed: true, StatusPaid: true, StatusCancelled: true}[status] {
		return Trade{}, ErrInvalidStatus
	}
	id, err := primitive.ObjectIDFromHex(tradeID)
	if err != nil {
		return Trade{}, ErrTradeNotFound
	}
	trade, err := s.trades.FindByID(ctx, id)
	if err != nil {
		return Trade{}, ErrTradeNotFound
	}
	if err := s.trades.SetStatus(ctx, id, status, note); err != nil {
		return Trade{}, err
	}
	if status == StatusPaid {
		_ = s.mailer.Send(trade.UserEmail, "Thiago Exchange payment receipt", fmt.Sprintf("Payment sent for trade %s.\nAmount: NGN %.2f\nNote: %s", trade.ID.Hex(), trade.ExpectedNGN, note))
	}
	trade.Status = status
	trade.ReceiptNote = note
	return trade, nil
}

func (s *Service) findAuthorized(ctx context.Context, user auth.User, tradeID string) (Trade, error) {
	id, err := primitive.ObjectIDFromHex(tradeID)
	if err != nil {
		return Trade{}, ErrTradeNotFound
	}
	trade, err := s.trades.FindByID(ctx, id)
	if err != nil {
		return Trade{}, ErrTradeNotFound
	}
	if user.Role != auth.RoleAdmin && trade.UserID != user.ID {
		return Trade{}, ErrForbidden
	}
	return trade, nil
}
