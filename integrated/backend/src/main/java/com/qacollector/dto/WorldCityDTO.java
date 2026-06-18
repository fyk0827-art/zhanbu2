package com.qacollector.dto;

import java.math.BigDecimal;

public class WorldCityDTO {
    private Long id;
    private String nameZh;
    private String nameEn;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal timezone;

    public WorldCityDTO(Long id, String nameZh, String nameEn, BigDecimal latitude, BigDecimal longitude, BigDecimal timezone) {
        this.id = id;
        this.nameZh = nameZh;
        this.nameEn = nameEn;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timezone = timezone;
    }

    public Long getId() { return id; }
    public String getNameZh() { return nameZh; }
    public String getNameEn() { return nameEn; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public BigDecimal getTimezone() { return timezone; }
}
