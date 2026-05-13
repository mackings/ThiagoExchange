package auth

import (
	"context"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) *Repository {
	return &Repository{collection: db.Collection("users")}
}

func (r *Repository) EnsureIndexes(ctx context.Context) error {
	_, err := r.collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	return err
}

func (r *Repository) Create(ctx context.Context, user User) (User, error) {
	res, err := r.collection.InsertOne(ctx, user)
	if err != nil {
		return User{}, err
	}
	user.ID = res.InsertedID.(primitive.ObjectID)
	return user, nil
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (User, error) {
	var user User
	err := r.collection.FindOne(ctx, bson.M{"email": strings.ToLower(strings.TrimSpace(email))}).Decode(&user)
	return user, err
}

func (r *Repository) FindByID(ctx context.Context, id primitive.ObjectID) (User, error) {
	var user User
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	return user, err
}

func (r *Repository) SetRole(ctx context.Context, id primitive.ObjectID, role string) error {
	_, err := r.collection.UpdateByID(ctx, id, bson.M{"$set": bson.M{"role": role}})
	return err
}

func (r *Repository) UpdateProfile(ctx context.Context, id primitive.ObjectID, name, phone string) (User, error) {
	_, err := r.collection.UpdateByID(ctx, id, bson.M{"$set": bson.M{
		"name":  strings.TrimSpace(name),
		"phone": strings.TrimSpace(phone),
	}})
	if err != nil {
		return User{}, err
	}
	return r.FindByID(ctx, id)
}
