package com.qacollector.repository;

import com.qacollector.entity.QuestionTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionTranslationRepository extends JpaRepository<QuestionTranslation, Long> {
    Optional<QuestionTranslation> findByQuestionIdAndLanguageCode(Long questionId, String languageCode);
    List<QuestionTranslation> findByQuestionId(Long questionId);
}
