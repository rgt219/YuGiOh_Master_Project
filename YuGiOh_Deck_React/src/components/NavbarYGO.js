import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

export default function NavbarYGO({ user, onLogout }) {
  return (
    <Navbar bg="dark" data-bs-theme="dark" fixed="top" style={{fontFamily: "Cascadia Mono"}}>
      <Container fluid>
        <Navbar.Brand as={Link} to="/">ErreGeTe YGO</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/about">About</Nav.Link>
            <Nav.Link as={Link} to="/contact">Contact</Nav.Link>
            <Nav.Link as={Link} to="/deckbuilder">Build</Nav.Link>
          </Nav>

          {/* Right side of Navbar */}
          <Nav className="align-items-center">
            {user ? (
              <div className="d-flex align-items-center">
                <NavDropdown 
                  title={`${user.userName}`} 
                  id="user-dropdown" 
                  align="end"
                  className="terminal-user-link"
                >
                  <NavDropdown.Item as={Link} to="/profile">VIEW PROFILE</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={onLogout}>LOGOUT</NavDropdown.Item>
                </NavDropdown>
                <div className="empty-avatar ms-2"></div>
              </div>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}