package com.qacollector.dto;

public class WorldProvinceDTO {
    private Long id;
    private String nameZh;
    private String nameEn;

    public WorldProvinceDTO(Long id, String nameZh, String nameEn) {
        this.id = id;
        this.nameZh = nameZh;
        this.nameEn = nameEn;
    }

    public Long getId() { return id; }
    public String getNameZh() { return nameZh; }
    public String getNameEn() { return nameEn; }
}
