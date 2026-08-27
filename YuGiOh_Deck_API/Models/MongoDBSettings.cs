namespace YuGiOhDeckApi.Models
{
    public class MongoDBSettings
    {
        public string ConnectionURI { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string CollectionName { get; set; } = null!;
        public string UsersDatabaseName { get; set; } = "UsersDB";
        public string UsersCollectionName { get; set; } = "Users";
    }
}
