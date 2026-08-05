package main

import (
	"context"
	"log"
	"math"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ForumThread struct {
	ID           string    `bson:"_id"`
	Upvotes      int       `bson:"Upvotes"`
	CommentCount int       `bson:"CommentCount"`
	CreatedAt    time.Time `bson:"CreatedAt"`
}

// Hacker News style gravity decay formula
func CalculateHotScore(upvotes int, commentCount int, createdAt time.Time) float64 {
	hoursOld := time.Since(createdAt).Hours()
	score := float64(upvotes + (commentCount * 2))
	gravity := 1.5
	return score / math.Pow(hoursOld+2, gravity)
}

func main() {
	mongoURI := "YOUR_MONGODB_CONNECTION_STRING"
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}

	collection := client.Database("YuGiOhForums").Collection("Threads")

	ticker := time.NewTicker(10 * time.Minute)
	log.Println("⚡ Go Forum Hot-Ranking Worker Active...")

	for range ticker.C {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			cursor, err := collection.Find(ctx, bson.M{})
			if err != nil {
				return
			}
			defer cursor.Close(ctx)

			for cursor.Next(ctx) {
				var thread ForumThread
				if err := cursor.Decode(&thread); err != nil {
					continue
				}

				hotScore := CalculateHotScore(thread.Upvotes, thread.CommentCount, thread.CreatedAt)

				// Concurrent update
				filter := bson.M{"_id": thread.ID}
				update := bson.M{"$set": bson.M{"HotScore": hotScore}}
				collection.UpdateOne(ctx, filter, update)
			}
			log.Println("Successfully recalculated HotScores for all forum threads.")
		}()
	}
}
