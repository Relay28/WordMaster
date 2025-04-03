package cit.edu.wrdmstr.dto;

import cit.edu.wrdmstr.entity.UserEntity;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminCreateDto {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    //@Size(min = 12, message = "Password must be at least 12 characters")
    private String password;

  //  @NotBlank
    private String fname;

   // @NotBlank
    private String lname;

    // Optional profile picture
    private String profilePicture;

    public AdminCreateDto() {
    }
    public AdminCreateDto(UserEntity savedAdmin) {
        this.email=savedAdmin.getEmail();
        this.password = savedAdmin.getPassword();
        this.fname = savedAdmin.getFname();
        this.lname=savedAdmin.getLname();
        this.profilePicture = savedAdmin.getProfilePicture();

    }

    public AdminCreateDto(String email, String password, String fname, String lname, String profilePicture) {
        this.email = email;
        this.password = password;
        this.fname = fname;
        this.lname = lname;
        this.profilePicture = profilePicture;
    }

    // Getters and setters


    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }
}