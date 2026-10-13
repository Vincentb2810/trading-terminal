package com.tradingterminal.backend;

public record Quote(double c, double h, double l, double o, double pc, long t) {
    // c = aktueller Kurs, h = Tageshoch, l = Tagestief,
    // o = Eröffnungskurs, pc = Vortagesschluss, t = Zeitstempel
}