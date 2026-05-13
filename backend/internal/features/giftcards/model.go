package giftcards

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	StatusPending   = "pending"
	StatusSubmitted = "submitted"
	StatusCompleted = "completed"
	StatusRejected  = "rejected"
	StatusFailed    = "failed"
)

type Category struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Image string `json:"image,omitempty"`
}

type SellableGiftCard struct {
	ID       int      `json:"id"`
	Name     string   `json:"name"`
	Rate     float64  `json:"rate"`
	Minimum  float64  `json:"minimum"`
	Form     string   `json:"form"`
	Country  string   `json:"country"`
	Terms    string   `json:"terms"`
	Category Category `json:"category"`
}

type PayoutMethod struct {
	Name      string `json:"name"`
	Available bool   `json:"available"`
}

type Config struct {
	Configured    bool               `json:"configured"`
	Categories    []Category         `json:"giftCardCategories"`
	GiftCards     []SellableGiftCard `json:"sellableGiftcards"`
	PayoutMethods []PayoutMethod     `json:"sellGiftcardPayoutMethods"`
	Raw           map[string]any     `json:"raw,omitempty"`
}

type Attachment struct {
	Name        string `json:"name"`
	ContentType string `json:"contentType"`
	Data        string `json:"data"`
}

type SubmitInput struct {
	GiftCardID    int          `json:"giftcardId"`
	GiftCardName  string       `json:"giftcardName"`
	CategoryName  string       `json:"categoryName"`
	Amount        float64      `json:"amount"`
	PayoutMethod  string       `json:"payoutMethod"`
	PayoutAddress string       `json:"payoutAddress"`
	CardCode      string       `json:"cardCode"`
	PIN           string       `json:"pin"`
	Comments      string       `json:"comments"`
	Attachments   []Attachment `json:"attachments"`
}

type Order struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID            primitive.ObjectID `bson:"userId" json:"userId"`
	UserName          string             `bson:"userName" json:"userName"`
	UserEmail         string             `bson:"userEmail" json:"userEmail"`
	GiftCardID        int                `bson:"giftcardId" json:"giftcardId"`
	GiftCardName      string             `bson:"giftcardName" json:"giftcardName"`
	CategoryName      string             `bson:"categoryName" json:"categoryName"`
	Amount            float64            `bson:"amount" json:"amount"`
	Rate              float64            `bson:"rate" json:"rate"`
	ExpectedPayoutNGN float64            `bson:"expectedPayoutNgn" json:"expectedPayoutNgn"`
	PayoutMethod      string             `bson:"payoutMethod" json:"payoutMethod"`
	PayoutAddress     string             `bson:"payoutAddress,omitempty" json:"payoutAddress,omitempty"`
	CardCodeMasked    string             `bson:"cardCodeMasked,omitempty" json:"cardCodeMasked,omitempty"`
	PINMasked         string             `bson:"pinMasked,omitempty" json:"pinMasked,omitempty"`
	AttachmentCount   int                `bson:"attachmentCount" json:"attachmentCount"`
	Provider          string             `bson:"provider" json:"provider"`
	ProviderReference string             `bson:"providerReference,omitempty" json:"providerReference,omitempty"`
	ProviderStatus    string             `bson:"providerStatus,omitempty" json:"providerStatus,omitempty"`
	ProviderMessage   string             `bson:"providerMessage,omitempty" json:"providerMessage,omitempty"`
	Status            string             `bson:"status" json:"status"`
	RawProviderTrade  map[string]any     `bson:"rawProviderTrade,omitempty" json:"rawProviderTrade,omitempty"`
	CreatedAt         time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time          `bson:"updatedAt" json:"updatedAt"`
}
