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
    /** 旧货集市 / 缝合怪：抽到但尚未决定用途的角色牌。 */
    private volatile String pendingDraw;
    /** 附加能力（缝合怪），持续到本局结束。 */
    private final List<String> extras = new ArrayList<>();
    private volatile int score;

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

    public String getPendingDraw() {
        return pendingDraw;
    }

    public void setPendingDraw(String pendingDraw) {
        this.pendingDraw = pendingDraw;
    }

    public List<String> getExtras() {
        return extras;
    }

    public int getScore() {
        return score;
    }

    public void addScore(int delta) {
        this.score += delta;
    }

    public void setScore(int score) {
        this.score = score;
    }

    /** 标记本轮使用某角色（同时记入已用集合）。 */
    public void useCharacter(String characterId) {
        usedCharacters.add(characterId);
        activeCharacterId = characterId;
    }

    /** 取消使用某角色（回退）：从已用集合移除；若为当前使用则清空。 */
    public void unuseCharacter(String characterId) {
        usedCharacters.remove(characterId);
        if (characterId.equals(activeCharacterId)) {
            activeCharacterId = null;
        }
    }

    /** 旧货集市：用抽到的新选手替换当前出战角色。 */
    public void replaceWith(String newId) {
        if (newId == null || newId.isEmpty()) {
            return;
        }
        if (activeCharacterId != null && !activeCharacterId.equals(newId)) {
            characters.remove(activeCharacterId);
            usedCharacters.remove(activeCharacterId);
        }
        if (!characters.contains(newId)) {
            characters.add(newId);
        }
        activeCharacterId = newId;
        usedCharacters.add(newId);
        pendingDraw = null;
    }

    /** 缝合怪：把抽到的选手作为附加能力（持续到本局结束）。 */
    public void attachExtra(String id) {
        if (id != null && !id.isEmpty() && !extras.contains(id)) {
            extras.add(id);
        }
        pendingDraw = null;
    }

    /** 狸猫换太子：与对方交换角色牌（手牌 / 已用 / 出战）。 */
    public void swapCardsWith(Player other) {
        List<String> tmpChars = new ArrayList<>(this.characters);
        this.characters.clear();
        this.characters.addAll(other.characters);
        other.characters.clear();
        other.characters.addAll(tmpChars);

        Set<String> tmpUsed = new LinkedHashSet<>(this.usedCharacters);
        this.usedCharacters.clear();
        this.usedCharacters.addAll(other.usedCharacters);
        other.usedCharacters.clear();
        other.usedCharacters.addAll(tmpUsed);

        String tmpActive = this.activeCharacterId;
        this.activeCharacterId = other.activeCharacterId;
        other.activeCharacterId = tmpActive;

        String tmpPending = this.pendingDraw;
        this.pendingDraw = other.pendingDraw;
        other.pendingDraw = tmpPending;
    }

    /** 清空角色手牌与使用状态（用于重新发牌）。 */
    public void resetCharacters() {
        characters.clear();
        usedCharacters.clear();
        activeCharacterId = null;
        pendingDraw = null;
        extras.clear();
    }
}
