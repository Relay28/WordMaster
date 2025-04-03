package cit.edu.wrdmstr.dto;

import lombok.*;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String email;
    private String name;
    private String role;

    public static AuthResponse create(String token, Long id, String email, String name, String role) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setId(id);
        response.setEmail(email);
        response.setName(name);
        response.setRole(role);
        return response;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}