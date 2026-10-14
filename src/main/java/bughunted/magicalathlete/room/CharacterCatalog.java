package bughunted.magicalathlete.room;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 角色目录：从 {@code characters.json} 加载全部运动员角色，供服务器发牌与展示。
 */
@Component
public class CharacterCatalog {

    private final List<Character> characters;
    private final Map<String, Character> byId;

    public CharacterCatalog() {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("characters.json")) {
            if (in == null) {
                throw new IllegalStateException("classpath:characters.json 未找到");
            }
            List<Character> list = new ObjectMapper().readValue(in, new TypeReference<List<Character>>() {
            });
            this.characters = List.copyOf(list);
        } catch (IOException e) {
            throw new IllegalStateException("加载 characters.json 失败", e);
        }
        Map<String, Character> map = new LinkedHashMap<>();
        for (Character character : characters) {
            map.put(character.id(), character);
        }
        this.byId = Map.copyOf(map);
    }

    public List<Character> all() {
        return characters;
    }

    public Character get(String id) {
        return byId.get(id);
    }

    /** 返回洗牌后的全部角色 id 列表。 */
    public List<String> shuffledIds(Random random) {
        return shuffledIds(random, "mixed");
    }

    /** 返回洗牌后、属于指定角色池的角色 id 列表（gen1 / gen2 / mixed）。 */
    public List<String> shuffledIds(Random random, String set) {
        List<String> ids = new ArrayList<>();
        for (Character character : characters) {
            if (matchesSet(character.id(), set)) {
                ids.add(character.id());
            }
        }
        Collections.shuffle(ids, random);
        return ids;
    }

    /** 判断角色是否属于给定角色池：gen1 = c01–c36，gen2 = c37+，mixed = 全部。 */
    public static boolean matchesSet(String id, String set) {
        if (set == null || set.isBlank() || "mixed".equals(set)) {
            return true;
        }
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < id.length(); i++) {
            char ch = id.charAt(i);
            if (ch >= '0' && ch <= '9') {
                digits.append(ch);
            }
        }
        int num = digits.length() > 0 ? Integer.parseInt(digits.toString()) : 0;
        if ("gen1".equals(set)) {
            return num >= 1 && num <= 36;
        }
        if ("gen2".equals(set)) {
            return num >= 37;
        }
        return true;
    }
}
