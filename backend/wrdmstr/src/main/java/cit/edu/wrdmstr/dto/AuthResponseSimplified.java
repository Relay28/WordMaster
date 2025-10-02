package cit.edu.wrdmstr.dto;

import lombok.*;

/**
 * Simplified authentication response for OAuth callbacks.
 * 
 * This class excludes the profilePicture field to prevent HeadersTooLargeException
 * when the auth response is serialized and passed through URL parameters during
 * OAuth redirects. The profile picture can be large (LOB) and should be fetched
 * separately via the /api/profile endpoint after successful authentication.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseSimplified {
    private String token;
    private Long id;
    private String email;
    private String fname;
    private String lname;
    private String role;
    // Note: profilePicture is intentionally excluded to reduce header size

    public static AuthResponseSimplified create(String token, Long id, String email, String fname, String lname, String role) {
        AuthResponseSimplified response = new AuthResponseSimplified();
        response.setToken(token);
        response.setId(id);
        response.setEmail(email);
        response.setFname(fname);
        response.setLname(lname);
        response.setRole(role);
        return response;
    }

    public static AuthResponseSimplified fromAuthResponse(AuthResponse authResponse) {
        return create(
            authResponse.getToken(),
            authResponse.getId(),
            authResponse.getEmail(),
            authResponse.getFname(),
            authResponse.getLname(),
            authResponse.getRole()
        );
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFname() {
        return fname;
    }

    public void setFname(String fname) {
        this.fname = fname;
    }

    public String getLname() {
        return lname;
    }

    public void setLname(String lname) {
        this.lname = lname;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
