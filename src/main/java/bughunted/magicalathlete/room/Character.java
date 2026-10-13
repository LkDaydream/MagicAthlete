package bughunted.magicalathlete.room;

/**
 * 一名运动员角色：id、名称与技能描述。
 *
 * @param id     角色 id（如 c01）
 * @param name   中文名
 * @param nameEn 英文名
 * @param skill  技能描述
 */
public record Character(String id, String name, String nameEn, String skill) {
}
