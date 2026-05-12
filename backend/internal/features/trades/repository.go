package trades

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
	return &Repository{collection: db.Collection("trades")}
}

func (r *Repository) Create(ctx context.Context, trade Trade) (Trade, error) {
	res, err := r.collection.InsertOne(ctx, trade)
	if err != nil {
		return Trade{}, err
	}
	trade.ID = res.InsertedID.(primitive.ObjectID)
	return trade, nil
}

func (r *Repository) List(ctx context.Context, filter bson.M) ([]Trade, error) {
	cur, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.M{"createdAt": -1}))
	if err != nil {
		return nil, err
	}
	out := make([]Trade, 0)
	err = cur.All(ctx, &out)
	return out, err
}

func (r *Repository) FindByID(ctx context.Context, id primitive.ObjectID) (Trade, error) {
	var trade Trade
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&trade)
	return trade, err
}

func (r *Repository) SetHash(ctx context.Context, id primitive.ObjectID, hash string) error {
	_, err := r.collection.UpdateByID(ctx, id, bson.M{"$set": bson.M{"transactionHash": hash}})
	return err
}

func (r *Repository) AddMessage(ctx context.Context, id primitive.ObjectID, message Message) error {
	_, err := r.collection.UpdateByID(ctx, id, bson.M{"$push": bson.M{"messages": message}})
	return err
}

func (r *Repository) SetStatus(ctx context.Context, id primitive.ObjectID, status, note string) error {
	now := time.Now()
	set := bson.M{"status": status, "receiptNote": note}
	if status == StatusConfirmed {
		set["confirmedAt"] = now
	}
	if status == StatusPaid {
		set["paidAt"] = now
	}
	_, err := r.collection.UpdateByID(ctx, id, bson.M{"$set": set})
	return err
}

func (r *Repository) ExpirePending(ctx context.Context) error {
	_, err := r.collection.UpdateMany(ctx, bson.M{"status": StatusPending, "expiresAt": bson.M{"$lt": time.Now()}}, bson.M{"$set": bson.M{"status": StatusCancelled}})
	return err
}
