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
        List<String> ids = new ArrayList<>(characters.size());
        for (Character character : characters) {
            ids.add(character.id());
        }
        Collections.shuffle(ids, random);
        return ids;
    }
}
