package cit.edu.wrdmstr.dto;

import jakarta.persistence.Lob;
import lombok.*;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String email;
    private String fname;
    private String lname;
    private String role;

    @Lob
    private String profilePicture;
    public static AuthResponse create(String token, Long id, String email, String fname,String lname, String role,String profilePicture) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setId(id);
        response.setEmail(email);
        response.setFname(fname);
        response.setLname(lname);
        response.setRole(role);
        response.setProfilePicture(profilePicture);
        return response;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
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