using Microsoft.EntityFrameworkCore;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<DeckList> DeckList { get; set; }
        public DbSet<Card> CardList { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Card>(entity =>
            {
                entity.HasAlternateKey(e => e.CardId);
            });
        }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    }
}
