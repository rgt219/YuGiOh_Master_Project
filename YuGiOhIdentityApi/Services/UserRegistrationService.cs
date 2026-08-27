using MongoDB.Driver;
using YuGiOhIdentityApi.Models;
using Microsoft.Extensions.Options;

namespace YuGiOhIdentityApi.Services
{
    public class UserRegistrationService
    {
        private readonly IMongoCollection<UserRegistration> _users;

        public UserRegistrationService(IOptions<MongoDBUserSettings> mongoDBSettings)
        {
            MongoClient client = new MongoClient(mongoDBSettings.Value.ConnectionURI);
            IMongoDatabase database = client.GetDatabase(mongoDBSettings.Value.DatabaseName);
            _users = database.GetCollection<UserRegistration>(mongoDBSettings.Value.CollectionName);
        }

        public async Task<UserRegistration?> GetByEmailAsync(string email) =>
            await _users.Find(u => u.Email == email).FirstOrDefaultAsync();

        public async Task CreateAsync(UserRegistration newUser)
        {
            if (string.IsNullOrWhiteSpace(newUser.Email))
            {
                throw new ArgumentException("Email address is required for registration.");
            }

            var existingUser = await GetByEmailAsync(newUser.Email);

            if (existingUser != null)
            {
                throw new InvalidOperationException("User already exists.");
            }

            if (!string.IsNullOrEmpty(newUser.Password))
            {
                newUser.Password = BCrypt.Net.BCrypt.HashPassword(newUser.Password);
            }

            await _users.InsertOneAsync(newUser);
        }

        public async Task UpdateAsync(UserRegistration updatedUser)
        {
            if (!string.IsNullOrEmpty(updatedUser.Password) && !updatedUser.Password.StartsWith("$2"))
            {
                updatedUser.Password = BCrypt.Net.BCrypt.HashPassword(updatedUser.Password);
            }

            await _users.ReplaceOneAsync(u => u.Email == updatedUser.Email, updatedUser);
        }
    }
}