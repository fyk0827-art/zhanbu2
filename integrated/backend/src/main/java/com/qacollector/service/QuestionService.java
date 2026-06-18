package com.qacollector.service;

import com.qacollector.dto.*;
import com.qacollector.entity.*;
import com.qacollector.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final QuestionTranslationRepository translationRepository;
    private final QuestionOptionRepository optionRepository;
    private final AgeGroupRepository ageGroupRepository;
    private final AnswerRepository answerRepository;

    public List<QuestionDTO> getRandomQuestions(Long ageGroupId, String language, int limit) {
        List<Question> questions = questionRepository.findRandomByAgeGroupId(ageGroupId, limit);
        List<QuestionDTO> result = new ArrayList<>();

        for (Question q : questions) {
            QuestionDTO dto = new QuestionDTO();
            dto.setId(q.getId());
            dto.setAgeGroupId(q.getAgeGroupId());

            // Get translation - try requested language, fallback to English
            Optional<QuestionTranslation> trans = translationRepository
                .findByQuestionIdAndLanguageCode(q.getId(), language);
            if (trans.isEmpty() && !"en".equals(language)) {
                trans = translationRepository.findByQuestionIdAndLanguageCode(q.getId(), "en");
            }
            dto.setTitle(trans.map(QuestionTranslation::getTitle).orElse("Question #" + q.getId()));
            dto.setDescription(trans.map(QuestionTranslation::getDescription).orElse(""));
            dto.setIsActive(q.getIsActive());

            // Get age group
            AgeGroup ag = ageGroupRepository.findById(q.getAgeGroupId()).orElse(null);
            if (ag != null) {
                AgeGroupDTO agDto = new AgeGroupDTO();
                agDto.setId(ag.getId());
                agDto.setName(ag.getName());
                agDto.setMinAge(ag.getMinAge());
                agDto.setMaxAge(ag.getMaxAge());
                agDto.setPrice(ag.getPrice());
                dto.setAgeGroup(agDto);
            }

            // Get options
            List<QuestionOption> opts = optionRepository.findByQuestionIdOrderByOptionKeyAsc(q.getId());
            List<OptionDTO> optDtos = new ArrayList<>();
            for (QuestionOption o : opts) {
                OptionDTO od = new OptionDTO();
                od.setKey(o.getOptionKey());
                od.setText(o.getOptionText());
                optDtos.add(od);
            }
            dto.setOptions(optDtos);

            result.add(dto);
        }
        return result;
    }

    public List<AdminQuestionDTO> getAllQuestionsAdmin() {
        List<Question> questions = questionRepository.findAll();
        List<AdminQuestionDTO> result = new ArrayList<>();

        for (Question q : questions) {
            AdminQuestionDTO dto = new AdminQuestionDTO();
            dto.setId(q.getId());
            dto.setAgeGroupId(q.getAgeGroupId());
            dto.setIsActive(q.getIsActive());

            AgeGroup ag = ageGroupRepository.findById(q.getAgeGroupId()).orElse(null);
            dto.setAgeGroupName(ag != null ? ag.getName() : "Unknown");

            // Translations
            List<QuestionTranslation> transList = translationRepository.findByQuestionId(q.getId());
            List<TranslationDTO> tDtos = new ArrayList<>();
            for (QuestionTranslation t : transList) {
                TranslationDTO td = new TranslationDTO();
                td.setLanguageCode(t.getLanguageCode());
                td.setTitle(t.getTitle());
                td.setDescription(t.getDescription());
                tDtos.add(td);
            }
            dto.setTranslations(tDtos);

            // Options
            List<QuestionOption> opts = optionRepository.findByQuestionIdOrderByOptionKeyAsc(q.getId());
            List<OptionDTO> oDtos = new ArrayList<>();
            for (QuestionOption o : opts) {
                OptionDTO od = new OptionDTO();
                od.setKey(o.getOptionKey());
                od.setText(o.getOptionText());
                oDtos.add(od);
            }
            dto.setOptions(oDtos);

            result.add(dto);
        }
        return result;
    }

    @Transactional
    public Long createQuestion(CreateQuestionRequest req) {
        Question q = new Question();
        q.setAgeGroupId(req.getAgeGroupId());
        q.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        q = questionRepository.save(q);

        // Save translations
        for (TranslationDTO t : req.getTranslations()) {
            QuestionTranslation qt = new QuestionTranslation();
            qt.setQuestionId(q.getId());
            qt.setLanguageCode(t.getLanguageCode());
            qt.setTitle(t.getTitle());
            qt.setDescription(t.getDescription());
            translationRepository.save(qt);
        }

        // Save options
        for (OptionDTO o : req.getOptions()) {
            QuestionOption qo = new QuestionOption();
            qo.setQuestionId(q.getId());
            qo.setOptionKey(o.getKey());
            qo.setOptionText(o.getText());
            optionRepository.save(qo);
        }

        return q.getId();
    }

    @Transactional
    public void updateQuestion(Long id, CreateQuestionRequest req) {
        Question q = questionRepository.findById(id).orElseThrow();
        if (req.getAgeGroupId() != null) q.setAgeGroupId(req.getAgeGroupId());
        if (req.getIsActive() != null) q.setIsActive(req.getIsActive());
        questionRepository.save(q);

        // Update translations
        if (req.getTranslations() != null && !req.getTranslations().isEmpty()) {
            translationRepository.deleteAll(translationRepository.findByQuestionId(id));
            for (TranslationDTO t : req.getTranslations()) {
                QuestionTranslation qt = new QuestionTranslation();
                qt.setQuestionId(id);
                qt.setLanguageCode(t.getLanguageCode());
                qt.setTitle(t.getTitle());
                qt.setDescription(t.getDescription());
                translationRepository.save(qt);
            }
        }

        // Update options
        if (req.getOptions() != null && !req.getOptions().isEmpty()) {
            optionRepository.deleteAll(optionRepository.findByQuestionIdOrderByOptionKeyAsc(id));
            for (OptionDTO o : req.getOptions()) {
                QuestionOption qo = new QuestionOption();
                qo.setQuestionId(id);
                qo.setOptionKey(o.getKey());
                qo.setOptionText(o.getText());
                optionRepository.save(qo);
            }
        }
    }

    @Transactional
    public void deleteQuestion(Long id) {
        optionRepository.deleteAll(optionRepository.findByQuestionIdOrderByOptionKeyAsc(id));
        translationRepository.deleteAll(translationRepository.findByQuestionId(id));
        questionRepository.deleteById(id);
    }

    @Transactional
    public Long submitAnswer(SubmitAnswerRequest req) {
        Answer a = new Answer();
        a.setQuestionId(req.getQuestionId());
        a.setRespondentAge(req.getRespondentAge());
        a.setSelectedOption(req.getSelectedOption());
        a = answerRepository.save(a);
        return a.getId();
    }

    public PageDTO<AnswerDTO> getAllAnswers(int page, int pageSize) {
        List<Answer> answers = answerRepository.findAllByOrderByCreatedAtDesc(
            PageRequest.of(page - 1, pageSize));
        long total = answerRepository.count();

        List<AnswerDTO> dtos = new ArrayList<>();
        for (Answer a : answers) {
            AnswerDTO dto = new AnswerDTO();
            dto.setId(a.getId());
            dto.setQuestionId(a.getQuestionId());
            dto.setRespondentAge(a.getRespondentAge());
            dto.setSelectedOption(a.getSelectedOption());
            dto.setCreatedAt(a.getCreatedAt());

            // Get question title
            Optional<QuestionTranslation> qt = translationRepository
                .findByQuestionIdAndLanguageCode(a.getQuestionId(), "en");
            dto.setQuestionTitle(qt.map(QuestionTranslation::getTitle)
                .orElse("Question #" + a.getQuestionId()));

            dtos.add(dto);
        }

        PageDTO<AnswerDTO> result = new PageDTO<>();
        result.setItems(dtos);
        result.setTotal(total);
        result.setPage(page);
        result.setPageSize(pageSize);
        return result;
    }
}
