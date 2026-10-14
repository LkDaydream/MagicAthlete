package bughunted.magicalathlete.room;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** 角色目录查询接口：供前端「角色速查」拉取全部角色。 */
@RestController
public class CharacterController {

    private final CharacterCatalog catalog;

    public CharacterController(CharacterCatalog catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/api/characters")
    public List<Character> characters() {
        return catalog.all();
    }
}
