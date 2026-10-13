package bughunted.magicalathlete.room;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 房间内的一名玩家。玩家身份由客户端持有的 token 识别，用于断线重连。
 * 同时保存该玩家分到的角色手牌与每轮的使用情况。
 */
public class Player {

    private final String id;
    private final String token;
    private String name;
    private final String color;
    private volatile boolean connected;
    private final List<String> characters = new ArrayList<>();
    private final Set<String> usedCharacters = new LinkedHashSet<>();
    private volatile String activeCharacterId;

    public Player(String id, String token, String name, String color) {
        this.id = id;
        this.token = token;
        this.name = name;
        this.color = color;
        this.connected = true;
    }

    public String getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getColor() {
        return color;
    }

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }

    public List<String> getCharacters() {
        return characters;
    }

    public Set<String> getUsedCharacters() {
        return usedCharacters;
    }

    public String getActiveCharacterId() {
        return activeCharacterId;
    }

    /** 标记本轮使用某角色（同时记入已用集合）。 */
    public void useCharacter(String characterId) {
        usedCharacters.add(characterId);
        activeCharacterId = characterId;
    }

    /** 清空角色手牌与使用状态（用于重新发牌）。 */
    public void resetCharacters() {
        characters.clear();
        usedCharacters.clear();
        activeCharacterId = null;
    }
}
