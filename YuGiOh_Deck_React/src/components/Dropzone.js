import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Container, Row, Col, Card } from 'react-bootstrap';

export default function ImageDropzone({ onDrop }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': [] // Accept all image types
    },
    onDrop
  });

  return (
    <Container>
      <Row className="justify-content-center mt-4">
        <Col md={6}>
          <Card 
            {...getRootProps()} 
            className={`p-4 text-center ${isDragActive ? 'border-primary bg-light' : 'border-secondary'}`}
            style={{ cursor: 'pointer', borderStyle: 'dashed' }}
          >
            <input {...getInputProps()} />
            {
              isDragActive ?
                <p>Drop the images here ...</p> :
                <p>Drag and drop image files here, or click to select files</p>
            }
          </Card>
        </Col>
      </Row>
    </Container>
  );
}