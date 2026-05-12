package rates

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) *Repository {
	return &Repository{collection: db.Collection("rates")}
}

func (r *Repository) SeedDefaults(ctx context.Context) error {
	count, err := r.collection.CountDocuments(ctx, bson.M{})
	if err != nil || count > 0 {
		return err
	}
	now := time.Now()
	_, err = r.collection.InsertMany(ctx, []interface{}{
		Rate{Coin: "USDT", Network: "TRC20", BuyRateNGN: 1480, WalletAddress: "Set wallet in admin", MinAmountUSD: 20, Active: true, UpdatedAt: now},
		Rate{Coin: "BTC", Network: "Bitcoin", BuyRateNGN: 1450, WalletAddress: "Set wallet in admin", MinAmountUSD: 30, Active: true, UpdatedAt: now},
		Rate{Coin: "ETH", Network: "ERC20", BuyRateNGN: 1440, WalletAddress: "Set wallet in admin", MinAmountUSD: 30, Active: true, UpdatedAt: now},
	})
	return err
}

func (r *Repository) Active(ctx context.Context) ([]Rate, error) {
	cur, err := r.collection.Find(ctx, bson.M{"active": true}, options.Find().SetSort(bson.M{"coin": 1}))
	if err != nil {
		return nil, err
	}
	out := make([]Rate, 0)
	err = cur.All(ctx, &out)
	return out, err
}

func (r *Repository) FindActiveByID(ctx context.Context, id primitive.ObjectID) (Rate, error) {
	var rate Rate
	err := r.collection.FindOne(ctx, bson.M{"_id": id, "active": true}).Decode(&rate)
	return rate, err
}

func (r *Repository) Update(ctx context.Context, id primitive.ObjectID, input Rate) error {
	_, err := r.collection.UpdateByID(ctx, id, bson.M{"$set": bson.M{
		"buyRateNgn":    input.BuyRateNGN,
		"walletAddress": input.WalletAddress,
		"minAmountUsd":  input.MinAmountUSD,
		"active":        input.Active,
		"updatedAt":     time.Now(),
	}})
	return err
}
