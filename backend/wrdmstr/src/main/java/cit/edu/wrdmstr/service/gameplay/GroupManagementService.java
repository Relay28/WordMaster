package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.GameSessionEntityRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupManagementService {

    @Autowired
    private GameSessionEntityRepository gameSessionRepository;
    
    @Autowired
    private PlayerSessionEntityRepository playerSessionRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Transactional
    public List<Map<String, Object>> organizeGroups(Long sessionId) {
        System.out.println("Starting group organization for session: " + sessionId);
        // Get game session
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
            
        // Get session settings
        int studentsPerGroup = session.getContent().getGameConfig().getStudentsPerGroup();
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(sessionId);

        System.out.println("Found " + players.size() + " players, organizing into groups of " + studentsPerGroup);
        
        if (players.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Shuffle players for random grouping
        List<PlayerSessionEntity> shuffledPlayers = new ArrayList<>(players);
        Collections.shuffle(shuffledPlayers);
        
        // Calculate number of groups needed
        int numGroups = (int) Math.ceil((double) players.size() / studentsPerGroup);
        List<Map<String, Object>> groups = new ArrayList<>();
        
        // Get roles for this content
        List<Role> availableRoles = roleRepository.findByContentDataContentId(session.getContent().getId());
        System.out.println("Creating " + numGroups + " groups with " + availableRoles.size() + " available roles");
       
        // Create groups
        for (int i = 0; i < numGroups; i++) {
            System.out.println("Creating group " + (i + 1));
            
            Map<String, Object> group = new HashMap<>();
            group.put("groupId", i + 1);
            
            // Get players for this group
            int startIndex = i * studentsPerGroup;
            int endIndex = Math.min((i + 1) * studentsPerGroup, shuffledPlayers.size());
            List<PlayerSessionEntity> groupMembers = shuffledPlayers.subList(startIndex, endIndex);
            
            System.out.println("Group " + (i + 1) + " has " + groupMembers.size() + " members");

           // Assign roles to players in this group
        int roleIndex = 0;
        for (PlayerSessionEntity player : groupMembers) {
            // Set the group number for persistence
            player.setGroupNumber(i + 1); // Using 1-based group index
            
            if (!availableRoles.isEmpty()) {
                // Assign role
                Role role = availableRoles.get(roleIndex % availableRoles.size());
                player.setRole(role);
                System.out.println("  - Assigned player " + player.getUser().getFname() + " " + 
                    player.getUser().getLname() + " to group " + (i + 1) + " with role: " + role.getName());
                roleIndex++;
            } else {
                System.out.println("  - Assigned player " + player.getUser().getFname() + " " + 
                    player.getUser().getLname() + " to group " + (i + 1) + " with no role (no roles available)");
            }
            playerSessionRepository.save(player);
        }
            
            // Add players to group
            List<Map<String, Object>> memberData = groupMembers.stream()
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("playerId", p.getUser().getId());
                    data.put("name", p.getUser().getFname() + " " + p.getUser().getLname());
                    data.put("role", p.getRole() != null ? p.getRole().getName() : "Participant");
                    return data;
                })
                .collect(Collectors.toList());
                
            group.put("members", memberData);
            groups.add(group);
        }
        System.out.println("Group organization complete. Created " + groups.size() + " groups");
        return groups;
    }
    
    @Transactional
    public PlayerSessionEntity assignRole(Long playerId, Long roleId) {
        // Get player and role
        PlayerSessionEntity player = playerSessionRepository.findById(playerId)
            .orElseThrow(() -> new RuntimeException("Player not found"));
            
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new RuntimeException("Role not found"));
        
        // Add logging to debug
        System.out.println("Assigning role: " + role.getName() + " to player: " + 
            player.getUser().getFname() + " " + player.getUser().getLname());
        
        // Assign role to player
        player.setRole(role);
        return playerSessionRepository.save(player);
    }
}