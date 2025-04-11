package cit.edu.wrdmstr.dto;

import cit.edu.wrdmstr.entity.UserEntity;
public class UserDto {
    private Long id;
    private String email;
    private String fname;
    private String lname;

    private String role;
    private String profilePicture;
    private boolean active;

    // Exclude password and role from DTO
    public UserDto(UserEntity user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fname = user.getFname();
        this.lname = user.getLname();
        this.profilePicture = user.getProfilePicture();
        this.role = user.getRole();
        this.active = user.isActive();
    }

    // Getters and setters


    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }
}