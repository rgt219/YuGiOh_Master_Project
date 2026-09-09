'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Row, Col, Card, Badge, Button } from 'react-bootstrap';

export default function NewsGrid({ articles }) {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-5 text-white-50 cascadia-font">
        <h5>NO ARTICLES ARCHIVED YET. SCRAPER MAY STILL BE RUNNING.</h5>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .news-card {
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          background-color: rgba(8, 12, 20, 0.95) !important;
          backdrop-filter: blur(10px);
        }
        .news-card:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 12px 30px rgba(0, 242, 255, 0.18) !important;
          border-color: #00f2ff !important;
        }
        .news-img-container {
          overflow: hidden;
        }
        .news-img-container img {
          transition: transform 0.5s ease;
        }
        .news-card:hover .news-img-container img {
          transform: scale(1.08);
        }
      `}</style>

      <Row className="g-4">
        {articles.map((article) => {
          return (
            <Col xs={12} sm={6} md={6} lg={4} xl={3} key={article.id}>
              <Card className="h-100 shadow-lg border-info border-opacity-50 news-card d-flex flex-column text-white rounded-3">
                
                {/* Thumbnail Header */}
                <div 
                  className="position-relative w-100 d-flex align-items-center justify-content-center news-img-container rounded-top" 
                  style={{ 
                    minHeight: '200px', 
                    height: '200px', 
                    backgroundColor: '#11151d', 
                    borderBottom: '1px solid rgba(0, 210, 255, 0.2)',
                    flexShrink: 0
                  }}
                >
                  {article.imageUrl ? (
                    <Image 
                      src={article.imageUrl} 
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  ) : (
                    <Image 
                      src="/masq.png" 
                      alt="No Image"
                      fill
                      sizes="25vw"
                      style={{ objectFit: 'contain', padding: '40px', opacity: 0.3, filter: 'grayscale(100%) brightness(200%)' }}
                    />
                  )}
                </div>

                <Card.Body className="d-flex flex-column p-3">
                  {/* Title */}
                  <h6 
                    className="fw-bold mb-3 cascadia-font text-light" 
                    style={{ 
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden', 
                      minHeight: '54px',
                      lineHeight: '1.4'
                    }}
                  >
                    {article.title}
                  </h6>

                  {/* Metadata Row (Date & Author) */}
                  <div className="d-flex align-items-center gap-3 mb-2 text-white-50 small cascadia-font" style={{ fontSize: '0.75rem' }}>
                    <span>📅 {new Date(article.publishedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>✍️ {article.author || 'YGOrganization'}</span>
                  </div>

                  {/* Description Snippet */}
                  <p 
                    className="text-white-50 small mb-3 flex-grow-1 cascadia-font" 
                    style={{ 
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      lineHeight: '1.4',
                      fontSize: '0.85rem'
                    }}
                  >
                    {article.description.replace(/<[^>]+>/g, '')}
                  </p>

                  {/* Categories Badges (Matching the bottom tags in your screenshot) */}
                  {article.categories && article.categories.length > 0 && (
                    <div className="mb-3 d-flex flex-wrap gap-1">
                      <span className="text-white-50 small me-1 cascadia-font" style={{ fontSize: '0.75rem', alignSelf: 'center' }}>Categories:</span>
                      {article.categories.map((cat, idx) => (
                        <Badge 
                          key={idx} 
                          bg="dark" 
                          className="border border-secondary border-opacity-50 text-info cascadia-font"
                          style={{ fontSize: '0.7rem' }}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* External Read Button */}
                  <div className="mt-auto pt-2 border-top border-secondary border-opacity-25">
                    <Button 
                      as={Link} 
                      href={article.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline-info" 
                      className="w-100 fw-bold cascadia-font text-nowrap py-1.5"
                      style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}
                    >
                      READ FULL ARTICLE
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );
}