package com.tradingterminal.backend;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class GdacsService {

    private static final String FEED_URL = "https://www.gdacs.org/xml/rss.xml";
    private final RestClient restClient = RestClient.create();
    private volatile List<DisasterEvent> cache = Collections.emptyList();

    @Scheduled(fixedRate = 5 * 60 * 1000, initialDelay = 0)
    public void refresh() {
        try {
            String xml = restClient.get().uri(FEED_URL).retrieve().body(String.class);
            cache = parse(xml);
        } catch (Exception e) {
            System.err.println("GDACS-Feed konnte nicht geladen werden, alte Daten bleiben aktiv: " + e.getMessage());
        }
    }

    public List<DisasterEvent> getEvents() {
        return cache;
    }

    private List<DisasterEvent> parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

        List<DisasterEvent> events = new ArrayList<>();
        NodeList items = doc.getElementsByTagName("item");

        for (int i = 0; i < items.getLength(); i++) {
            Element item = (Element) items.item(i);
            String point = textNS(item, "http://www.georss.org/georss", "point");
            if (point == null || point.isBlank())
                continue;
            String[] parts = point.trim().split("\\s+");
            if (parts.length < 2)
                continue;

            events.add(new DisasterEvent(
                    text(item, "guid"),
                    textNS(item, "http://www.gdacs.org", "eventtype"),
                    textNS(item, "http://www.gdacs.org", "alertlevel"),
                    text(item, "title"),
                    textNS(item, "http://www.gdacs.org", "country"),
                    Double.parseDouble(parts[0]),
                    Double.parseDouble(parts[1]),
                    text(item, "pubDate")));
        }
        return events;
    }

    private String text(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagName(tag);
        return nodes.getLength() > 0 ? nodes.item(0).getTextContent() : null;
    }

    private String textNS(Element parent, String namespaceUri, String localName) {
        NodeList nodes = parent.getElementsByTagNameNS(namespaceUri, localName);
        return nodes.getLength() > 0 ? nodes.item(0).getTextContent() : null;
    }
}