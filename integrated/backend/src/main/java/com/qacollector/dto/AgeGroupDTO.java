package com.qacollector.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AgeGroupDTO {
    private Long id;
    private String name;
    private Integer minAge;
    private Integer maxAge;
    private BigDecimal price;
    private Integer sortOrder;
}
