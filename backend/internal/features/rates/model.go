package rates

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Rate struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Coin          string             `bson:"coin" json:"coin"`
	Network       string             `bson:"network" json:"network"`
	BuyRateNGN    float64            `bson:"buyRateNgn" json:"buyRateNgn"`
	WalletAddress string             `bson:"walletAddress" json:"walletAddress"`
	MinAmountUSD  float64            `bson:"minAmountUsd" json:"minAmountUsd"`
	Active        bool               `bson:"active" json:"active"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}
