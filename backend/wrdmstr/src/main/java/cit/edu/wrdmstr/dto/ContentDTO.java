package cit.edu.wrdmstr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentDTO {
    private Long id;
    private String title;
    private String description;
    private String backgroundTheme;
    private String contentData;
    private String gameElementConfig;
    private Long creatorId;
    private String creatorName;
    private Long classroomId;
    private String classroomName;
    private boolean published;
    private Date createdAt;
    private Date updatedAt;
}
