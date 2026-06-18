package com.qacollector.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "respondent_age", nullable = false)
    private Integer respondentAge;

    @Column(name = "selected_option", nullable = false, length = 1)
    private String selectedOption;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
