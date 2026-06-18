package com.qacollector.config;

import com.qacollector.entity.*;
import com.qacollector.repository.*;
import com.qacollector.service.ReportPromptService;
import com.qacollector.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AgeGroupRepository ageGroupRepository;
    private final AdminUserRepository adminUserRepository;
    private final QuestionRepository questionRepository;
    private final QuestionTranslationRepository translationRepository;
    private final QuestionOptionRepository optionRepository;
    private final BCryptPasswordEncoder encoder;
    private final SettingsService settingsService;
    private final ReportPromptService reportPromptService;
    private final AdminInitProperties adminInitProperties;

    @Override
    @Transactional
    public void run(String... args) {
        settingsService.seedDefaults();
        reportPromptService.seedDefaults();
        initAgeGroups();
        initAdminUser();
        initSampleQuestions();
    }

    private void initAgeGroups() {
        if (ageGroupRepository.count() > 0) return;

        BigDecimal unifiedPrice = new BigDecimal("9.99");
        List<AgeGroup> groups = List.of(
            createAgeGroup("Children (3-12)", 3, 12, unifiedPrice, 1),
            createAgeGroup("Teenagers (13-17)", 13, 17, unifiedPrice, 2),
            createAgeGroup("Young Adults (18-25)", 18, 25, unifiedPrice, 3),
            createAgeGroup("Adults (26-40)", 26, 40, unifiedPrice, 4),
            createAgeGroup("Middle-aged (41-60)", 41, 60, unifiedPrice, 5),
            createAgeGroup("Seniors (60+)", 60, 120, unifiedPrice, 6)
        );
        ageGroupRepository.saveAll(groups);
    }

    private AgeGroup createAgeGroup(String name, int min, int max, BigDecimal price, int order) {
        AgeGroup g = new AgeGroup();
        g.setName(name);
        g.setMinAge(min);
        g.setMaxAge(max);
        g.setPrice(price);
        g.setSortOrder(order);
        g.setCreatedAt(LocalDateTime.now());
        return g;
    }

    private void initAdminUser() {
        if (adminUserRepository.count() > 0) return;

        String username = adminInitProperties.getUsername();
        String password = adminInitProperties.getPassword();
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        AdminUser admin = new AdminUser();
        admin.setUsername(username.trim());
        admin.setDisplayName("超级管理员");
        admin.setPasswordHash(encoder.encode(password));
        admin.setRole("super_admin");
        admin.setIsActive(true);
        admin.setCreatedAt(now);
        admin.setUpdatedAt(now);
        adminUserRepository.save(admin);
    }

    private void initSampleQuestions() {
        if (questionRepository.count() > 0) return;

        // Children group questions (id=1)
        createQuestionWithData(1L,
            List.of(
                new Trans("en", "What's your favorite color?", "Pick the color you like most!"),
                new Trans("zh", "你最喜欢什么颜色？", "选择你最喜欢的颜色！"),
                new Trans("es", "¿Cuál es tu color favorito?", "¡Elige el color que más te guste!"),
                new Trans("fr", "Quelle est ta couleur préférée ?", "Choisis la couleur que tu préfères !"),
                new Trans("ja", "好きな色は何ですか？", "一番好きな色を選んでください！")
            ),
            List.of(
                new Opt("A", "Red / 红色"), new Opt("B", "Blue / 蓝色"),
                new Opt("C", "Green / 绿色"), new Opt("D", "Yellow / 黄色")
            )
        );

        createQuestionWithData(1L,
            List.of(
                new Trans("en", "What do you want to be when you grow up?", "Choose your dream job!"),
                new Trans("zh", "长大后想做什么？", "选择你梦想的职业！"),
                new Trans("es", "¿Qué quieres ser de mayor?", "¡Elige tu trabajo soñado!"),
                new Trans("fr", "Que veux-tu faire plus tard ?", "Choisis ton métier de rêve !"),
                new Trans("ja", "大きくなったら何になりたいですか？", "夢の職業を選んでください！")
            ),
            List.of(
                new Opt("A", "Doctor / 医生"), new Opt("B", "Teacher / 老师"),
                new Opt("C", "Astronaut / 宇航员"), new Opt("D", "Artist / 艺术家")
            )
        );

        // Teenagers group questions (id=2)
        createQuestionWithData(2L,
            List.of(
                new Trans("en", "How do you prefer to study?", "Choose your study style"),
                new Trans("zh", "你喜欢怎样学习？", "选择你的学习方式"),
                new Trans("es", "¿Cómo prefieres estudiar?", "Elige tu estilo de estudio"),
                new Trans("fr", "Comment préfères-tu étudier ?", "Choisis ton style d'étude"),
                new Trans("ja", "どのように勉強するのが好きですか？", "あなたの学習スタイルを選んでください")
            ),
            List.of(
                new Opt("A", "Study alone / 独自学习"), new Opt("B", "Study group / 小组学习"),
                new Opt("C", "Online courses / 在线课程"), new Opt("D", "Tutor / 家教辅导")
            )
        );

        // Young Adults group questions (id=3)
        createQuestionWithData(3L,
            List.of(
                new Trans("en", "What's your biggest career goal right now?", "Pick your top priority"),
                new Trans("zh", "你目前最大的职业目标是什么？", "选择你的首要目标"),
                new Trans("es", "¿Cuál es tu mayor objetivo profesional ahora?", "Elige tu prioridad principal"),
                new Trans("fr", "Quel est votre plus grand objectif de carrière actuellement ?", "Choisissez votre priorité"),
                new Trans("ja", "今の最大のキャリア目標は何ですか？", "最優先事項を選んでください")
            ),
            List.of(
                new Opt("A", "Get promoted / 获得晋升"), new Opt("B", "Start a business / 创业"),
                new Opt("C", "Switch careers / 转行"), new Opt("D", "Work abroad / 海外工作")
            )
        );

        // Adults group questions (id=4)
        createQuestionWithData(4L,
            List.of(
                new Trans("en", "How do you balance work and family?", "Choose your approach"),
                new Trans("zh", "你如何平衡工作与家庭？", "选择你的方式"),
                new Trans("es", "¿Cómo equilibras trabajo y familia?", "Elige tu enfoque"),
                new Trans("fr", "Comment équilibrez-vous travail et famille ?", "Choisissez votre approche"),
                new Trans("ja", "仕事と家族のバランスはどう取っていますか？", "あなたのアプローチを選んでください")
            ),
            List.of(
                new Opt("A", "Strict schedule / 严格时间表"), new Opt("B", "Flexible hours / 弹性时间"),
                new Opt("C", "Remote work / 远程办公"), new Opt("D", "Family first / 家庭优先")
            )
        );

        // Middle-aged group questions (id=5)
        createQuestionWithData(5L,
            List.of(
                new Trans("en", "What matters most to you now?", "Choose your priority"),
                new Trans("zh", "现在什么对你最重要？", "选择你的优先事项"),
                new Trans("es", "¿Qué es más importante para ti ahora?", "Elige tu prioridad"),
                new Trans("fr", "Qu'est-ce qui compte le plus pour vous maintenant ?", "Choisissez votre priorité"),
                new Trans("ja", "今あなたにとって最も重要なことは何ですか？", "優先事項を選んでください")
            ),
            List.of(
                new Opt("A", "Health / 健康"), new Opt("B", "Wealth / 财富"),
                new Opt("C", "Family / 家庭"), new Opt("D", "Legacy / 传承")
            )
        );

        // Seniors group questions (id=6)
        createQuestionWithData(6L,
            List.of(
                new Trans("en", "How do you stay active?", "Pick your favorite activity"),
                new Trans("zh", "你如何保持活力？", "选择你最喜欢的活动"),
                new Trans("es", "¿Cómo te mantienes activo?", "Elige tu actividad favorita"),
                new Trans("fr", "Comment restez-vous actif ?", "Choisissez votre activité préférée"),
                new Trans("ja", "どうやって活動的に過ごしていますか？", "お気に入りのアクティビティを選んでください")
            ),
            List.of(
                new Opt("A", "Walking / 散步"), new Opt("B", "Gardening / 园艺"),
                new Opt("C", "Reading / 阅读"), new Opt("D", "Social clubs / 社交活动")
            )
        );
    }

    private void createQuestionWithData(Long ageGroupId, List<Trans> transList, List<Opt> opts) {
        Question q = new Question();
        q.setAgeGroupId(ageGroupId);
        q.setIsActive(true);
        q.setCreatedAt(LocalDateTime.now());
        q = questionRepository.save(q);

        final Long qId = q.getId();

        for (Trans t : transList) {
            QuestionTranslation qt = new QuestionTranslation();
            qt.setQuestionId(qId);
            qt.setLanguageCode(t.lang);
            qt.setTitle(t.title);
            qt.setDescription(t.desc);
            translationRepository.save(qt);
        }

        for (Opt o : opts) {
            QuestionOption qo = new QuestionOption();
            qo.setQuestionId(qId);
            qo.setOptionKey(o.key);
            qo.setOptionText(o.text);
            optionRepository.save(qo);
        }
    }

    private record Trans(String lang, String title, String desc) {}
    private record Opt(String key, String text) {}
}
