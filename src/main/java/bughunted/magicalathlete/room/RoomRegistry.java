package bughunted.magicalathlete.room;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * 内存中的房间注册表。负责建房与按房间码查找。
 * 房间状态仅存于内存，进程重启即清空。
 */
@Component
public class RoomRegistry {

    /** 生成房间码时排除易混淆字符（0/O、1/I）。 */
    private static final char[] CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public Room createRoom() {
        String code;
        do {
            code = randomCode();
        } while (rooms.containsKey(code));
        Room room = new Room(code);
        rooms.put(code, room);
        return room;
    }

    public Room get(String code) {
        return code == null ? null : rooms.get(code.toUpperCase());
    }

    public void removeIfEmpty(Room room) {
        if (room != null && room.isEmpty()) {
            rooms.remove(room.getCode());
        }
    }

    /** 无条件移除房间（结束房间）。 */
    public void remove(Room room) {
        if (room != null) {
            rooms.remove(room.getCode());
        }
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            sb.append(CODE_ALPHABET[random.nextInt(CODE_ALPHABET.length)]);
        }
        return sb.toString();
    }
}
