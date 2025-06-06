package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_data_id")
    private ContentData contentData;



    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL)
    private List<PlayerSessionEntity> playerSessions = new ArrayList<>();

    public Role(Long id, String name, ContentData contentData) {
        this.id = id;
        this.name = name;
        this.contentData = contentData;
    }
    public Role(){
        super();
    }

    public Role(String roleName, ContentData contentData) {
        this.name=roleName;
        this.contentData=contentData;
    }

    public ContentData getContentData() {
        return contentData;
    }

    public void setContentData(ContentData contentData) {
        this.contentData = contentData;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<PlayerSessionEntity> getPlayerSessions() {
        return playerSessions;
    }

    public void setPlayerSessions(List<PlayerSessionEntity> playerSessions) {
        this.playerSessions = playerSessions;
    }
}