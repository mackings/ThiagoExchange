package giftcards

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
	return &Repository{collection: db.Collection("gift_card_orders")}
}

func (r *Repository) Create(ctx context.Context, order Order) (Order, error) {
	res, err := r.collection.InsertOne(ctx, order)
	if err != nil {
		return Order{}, err
	}
	order.ID = res.InsertedID.(primitive.ObjectID)
	return order, nil
}

func (r *Repository) List(ctx context.Context, filter bson.M) ([]Order, error) {
	cur, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.M{"createdAt": -1}))
	if err != nil {
		return nil, err
	}
	out := make([]Order, 0)
	err = cur.All(ctx, &out)
	return out, err
}

func (r *Repository) FindByID(ctx context.Context, id primitive.ObjectID) (Order, error) {
	var order Order
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&order)
	return order, err
}

func (r *Repository) UpdateProvider(ctx context.Context, id primitive.ObjectID, status, providerStatus, providerMessage, reference string, raw map[string]any) error {
	set := bson.M{
		"status":          status,
		"providerStatus":  providerStatus,
		"providerMessage": providerMessage,
		"updatedAt":       time.Now(),
	}
	if reference != "" {
		set["providerReference"] = reference
	}
	if raw != nil {
		set["rawProviderTrade"] = raw
	}
	_, err := r.collection.UpdateByID(ctx, id, bson.M{"$set": set})
	return err
}
