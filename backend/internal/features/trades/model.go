package trades

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	StatusPending   = "pending"
	StatusConfirmed = "confirmed"
	StatusPaid      = "paid"
	StatusCancelled = "cancelled"
)

type Trade struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          primitive.ObjectID `bson:"userId" json:"userId"`
	UserName        string             `bson:"userName" json:"userName"`
	UserEmail       string             `bson:"userEmail" json:"userEmail"`
	Coin            string             `bson:"coin" json:"coin"`
	Network         string             `bson:"network" json:"network"`
	AmountUSD       float64            `bson:"amountUsd" json:"amountUsd"`
	RateNGN         float64            `bson:"rateNgn" json:"rateNgn"`
	ExpectedNGN     float64            `bson:"expectedNgn" json:"expectedNgn"`
	WalletAddress   string             `bson:"walletAddress" json:"walletAddress"`
	PaymentBank     string             `bson:"paymentBank" json:"paymentBank"`
	AccountName     string             `bson:"accountName" json:"accountName"`
	AccountNumber   string             `bson:"accountNumber" json:"accountNumber"`
	TransactionHash string             `bson:"transactionHash" json:"transactionHash"`
	Status          string             `bson:"status" json:"status"`
	Messages        []Message          `bson:"messages" json:"messages"`
	ReceiptNote     string             `bson:"receiptNote" json:"receiptNote"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	ExpiresAt       time.Time          `bson:"expiresAt" json:"expiresAt"`
	ConfirmedAt     *time.Time         `bson:"confirmedAt,omitempty" json:"confirmedAt,omitempty"`
	PaidAt          *time.Time         `bson:"paidAt,omitempty" json:"paidAt,omitempty"`
}

type Message struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Sender        string             `bson:"sender" json:"sender"`
	Body          string             `bson:"body" json:"body"`
	AttachmentURL string             `bson:"attachmentUrl,omitempty" json:"attachmentUrl,omitempty"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
}
