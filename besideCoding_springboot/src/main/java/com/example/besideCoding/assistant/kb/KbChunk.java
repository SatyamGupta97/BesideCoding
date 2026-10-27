package com.example.besideCoding.assistant.kb;

/**
 * A retrievable slice of the site help documentation, split on "##" headings.
 *
 * @param document human readable document name, e.g. "Profile and account"
 * @param section  heading of this slice
 * @param body     markdown body without the heading
 */
public record KbChunk(String document, String section, String body) {

    public String render() {
        return "### " + document + " - " + section + "\n" + body.trim();
    }
}
