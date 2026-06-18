package com.qacollector.dto;

import lombok.Data;
import java.util.List;

@Data
public class PageDTO<T> {
    private List<T> items;
    private long total;
    private int page;
    private int pageSize;
}
