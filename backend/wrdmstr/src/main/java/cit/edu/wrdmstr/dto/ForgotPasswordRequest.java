package cit.edu.wrdmstr.dto;

public class ForgotPasswordRequest {
    private String email;

    // Constructors
    public ForgotPasswordRequest() {}

    public ForgotPasswordRequest(String email) {
        this.email = email;
    }

    // Getters and setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}