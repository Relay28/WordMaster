package cit.edu.wrdmstr.dto;

import lombok.Data;

import java.util.Date;
import java.util.List;


public class ContentDTO {
    private Long id;
    private String title;
    private String description;
    private String backgroundTheme;
    private boolean published;
    private Date createdAt;
    private Date updatedAt;
    private Long creatorId;
    private String creatorName;
    private Long classroomId;
    private String classroomName;
    private ContentDataDTO contentData;
    private GameConfigDTO gameConfig;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBackgroundTheme() {
        return backgroundTheme;
    }

    public void setBackgroundTheme(String backgroundTheme) {
        this.backgroundTheme = backgroundTheme;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public Long getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Long classroomId) {
        this.classroomId = classroomId;
    }

    public String getClassroomName() {
        return classroomName;
    }

    public void setClassroomName(String classroomName) {
        this.classroomName = classroomName;
    }

    public ContentDataDTO getContentData() {
        return contentData;
    }

    public void setContentData(ContentDataDTO contentData) {
        this.contentData = contentData;
    }

    public GameConfigDTO getGameConfig() {
        return gameConfig;
    }

    public void setGameConfig(GameConfigDTO gameConfig) {
        this.gameConfig = gameConfig;
    }
}