package giftcards

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strconv"
	"strings"
	"time"

	"thiagoxchange/backend/internal/config"
)

var ErrPrestmitNotConfigured = errors.New("prestmit api credentials are not configured")

type PrestmitClient struct {
	baseURL string
	apiKey  string
	secret  string
	client  *http.Client
}

func NewPrestmitClient(cfg config.Config) *PrestmitClient {
	return &PrestmitClient{
		baseURL: strings.TrimRight(cfg.PrestmitAPIBaseURL, "/"),
		apiKey:  cfg.PrestmitAPIKey,
		secret:  cfg.PrestmitAPISecret,
		client:  &http.Client{Timeout: 45 * time.Second},
	}
}

func (c *PrestmitClient) Configured() bool {
	return c.baseURL != "" && c.apiKey != "" && c.secret != ""
}

func (c *PrestmitClient) RateCalculatorData(ctx context.Context) (Config, error) {
	if !c.Configured() {
		return Config{Configured: false}, nil
	}
	var raw map[string]any
	if err := c.doJSON(ctx, http.MethodGet, "/giftcard-trade/sell/rate-calculator-data", nil, &raw); err != nil {
		return Config{}, err
	}
	cfg := Config{Configured: true, Raw: raw}
	data := unwrapDetails(raw)
	_ = remarshal(data["giftCardCategories"], &cfg.Categories)
	_ = remarshal(data["sellableGiftcards"], &cfg.GiftCards)
	_ = remarshal(data["sellGiftcardPayoutMethods"], &cfg.PayoutMethods)
	return cfg, nil
}

func (c *PrestmitClient) CreateSellTrade(ctx context.Context, input SubmitInput, uniqueIdentifier string) (map[string]any, error) {
	if !c.Configured() {
		return nil, ErrPrestmitNotConfigured
	}
	fields := map[string]string{
		"giftcard_id":      strconv.Itoa(input.GiftCardID),
		"amount":           cleanNumber(input.Amount),
		"payoutMethod":     input.PayoutMethod,
		"uniqueIdentifier": uniqueIdentifier,
	}
	if input.PayoutAddress != "" {
		fields["payoutAddress"] = input.PayoutAddress
	}
	if input.Comments != "" || input.CardCode != "" || input.PIN != "" {
		fields["comments"] = buildComments(input)
	}
	hashBody := map[string]any{}
	for key, value := range fields {
		hashBody[key] = value
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	for key, value := range fields {
		if err := writer.WriteField(key, value); err != nil {
			return nil, err
		}
	}
	for _, attachment := range input.Attachments {
		file, err := decodeAttachment(attachment)
		if err != nil {
			return nil, err
		}
		header := make(textproto.MIMEHeader)
		header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="attachments[]"; filename="%s"`, escapeQuotes(file.name)))
		header.Set("Content-Type", file.contentType)
		part, err := writer.CreatePart(header)
		if err != nil {
			return nil, err
		}
		if _, err := part.Write(file.data); err != nil {
			return nil, err
		}
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/giftcard-trade/sell/create", &body)
	if err != nil {
		return nil, err
	}
	c.setHeaders(req, hashBody)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	var raw map[string]any
	if err := c.send(req, &raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func (c *PrestmitClient) SellHistory(ctx context.Context, page int) (map[string]any, error) {
	if !c.Configured() {
		return nil, ErrPrestmitNotConfigured
	}
	if page < 1 {
		page = 1
	}
	var raw map[string]any
	err := c.doJSON(ctx, http.MethodGet, fmt.Sprintf("/giftcard-trade/sell/history?page=%d", page), nil, &raw)
	return raw, err
}

func (c *PrestmitClient) doJSON(ctx context.Context, method, path string, payload any, out any) error {
	var body io.Reader
	if payload != nil {
		buf, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		body = bytes.NewReader(buf)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, body)
	if err != nil {
		return err
	}
	c.setHeaders(req, payload)
	req.Header.Set("Content-Type", "application/json")
	return c.send(req, out)
}

func (c *PrestmitClient) send(req *http.Request, out any) error {
	req.Header.Set("Accept", "application/json")
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("prestmit api returned %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(body, out)
}

func (c *PrestmitClient) setHeaders(req *http.Request, payload any) {
	req.Header.Set("API-KEY", c.apiKey)
	req.Header.Set("API-Key", c.apiKey)
	req.Header.Set("API-Hash", c.hash(payload))
}

func (c *PrestmitClient) hash(payload any) string {
	body := "{}"
	if payload != nil {
		if b, err := json.Marshal(payload); err == nil {
			body = string(b)
		}
	}
	mac := hmac.New(sha256.New, []byte(c.secret))
	_, _ = mac.Write([]byte(c.apiKey + ":" + body))
	return hex.EncodeToString(mac.Sum(nil))
}

func buildComments(input SubmitInput) string {
	parts := []string{}
	if strings.TrimSpace(input.Comments) != "" {
		parts = append(parts, strings.TrimSpace(input.Comments))
	}
	if strings.TrimSpace(input.CardCode) != "" {
		parts = append(parts, "Card code: "+strings.TrimSpace(input.CardCode))
	}
	if strings.TrimSpace(input.PIN) != "" {
		parts = append(parts, "PIN: "+strings.TrimSpace(input.PIN))
	}
	return strings.Join(parts, "\n")
}

type decodedAttachment struct {
	name        string
	contentType string
	data        []byte
}

func decodeAttachment(attachment Attachment) (decodedAttachment, error) {
	contentType := attachment.ContentType
	data := attachment.Data
	if idx := strings.Index(data, ","); strings.HasPrefix(data, "data:") && idx > -1 {
		meta := data[5:idx]
		data = data[idx+1:]
		if semi := strings.Index(meta, ";"); semi > -1 {
			contentType = meta[:semi]
		}
	}
	if contentType == "" {
		contentType = "image/jpeg"
	}
	decoded, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return decodedAttachment{}, err
	}
	name := attachment.Name
	if name == "" {
		name = "giftcard.jpg"
	}
	return decodedAttachment{name: name, contentType: contentType, data: decoded}, nil
}

func cleanNumber(value float64) string {
	if value == float64(int64(value)) {
		return strconv.FormatInt(int64(value), 10)
	}
	return strconv.FormatFloat(value, 'f', 2, 64)
}

func escapeQuotes(value string) string {
	return strings.ReplaceAll(value, `"`, `\"`)
}

func unwrapDetails(raw map[string]any) map[string]any {
	for _, key := range []string{"data", "details", "result"} {
		if nested, ok := raw[key].(map[string]any); ok {
			return nested
		}
	}
	return raw
}

func remarshal(input any, out any) error {
	if input == nil {
		return nil
	}
	b, err := json.Marshal(input)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, out)
}
