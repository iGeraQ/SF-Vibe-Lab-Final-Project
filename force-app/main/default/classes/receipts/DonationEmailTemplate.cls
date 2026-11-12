/**
 * What the donor reads: the receipt email (HTML with a plain-text fallback) and the simulated invoice PDF
 * (US-14, US-06 AC8). Only formatting: no queries and no DML. Email clients ignore style sheets, so the email
 * uses tables and inline styles. Donor text is escaped (US-12), and an anonymous receipt never shows a name
 * (US-02 AC2), even when names are stored for its invoice.
 */
public with sharing class DonationEmailTemplate {

    private static final List<String> MONTHS = new List<String>{
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    };
    // Strong blue for the header, the link and the invoice note; the neutrals follow a payment-receipt look.
    private static final String BLUE = '#1D4ED8';
    private static final String DEEP = '#0B2A6F';
    private static final String TINT = '#EEF3FF';
    private static final String PAGE = '#F6F9FC';
    private static final String TITLE = '#32325D';
    private static final String BODY = '#525F7F';
    private static final String MUTED = '#687385';
    private static final String LINE = '#E6EBF1';
    private static final String FONT = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Ubuntu,sans-serif;';
    private static final String DISCLAIMER = 'Este recibo no es un comprobante fiscal (CFDI).';

    /**
     * @description The receipt's subject line.
     * @param donation the paid donation
     * @return the subject, with the donation reference
     */
    public static String subject(Opportunity donation) {
        return 'Gracias por tu donación · Recibo ' + donation.Donation_Reference__c;
    }

    /**
     * @description The name of the simulated invoice PDF attached to the receipt.
     * @param donation the paid donation
     * @return the file name, with the donation reference
     */
    public static String invoiceFileName(Opportunity donation) {
        return 'Factura-' + donation.Donation_Reference__c + '.pdf';
    }

    /**
     * @description The receipt as plain text, for email clients that don't show HTML.
     * @param donation the paid donation
     * @param supportEmail the program's support address, or null if none is set up yet
     * @return the text
     */
    public static String receiptText(Opportunity donation, String supportEmail) {
        String name = greetingName(donation);
        List<String> lines = new List<String>{
            name == null ? '¡Hola!' : '¡Hola, ' + name + '!',
            'Recibimos tu pago correctamente. Gracias por tu donación al programa Mexico Dreamin 2026.',
            '',
            'Referencia: ' + donation.Donation_Reference__c,
            'Campaña: ' + donation.Campaign.Name,
            'Monto: ' + money(donation.Amount),
            'Fecha: ' + spanishDate(donation.CloseDate),
            'Tipo de donación: ' + donation.Donation_Type__c
        };
        if (!donation.Is_Anonymous__c) {
            lines.add('Donante: ' + donorName(donation));
        }
        lines.add('');
        if (donation.Invoice_Requested__c) {
            lines.add('Adjuntamos tu factura en PDF (' + invoiceFileName(donation) + '); no es un comprobante fiscal.');
        }
        lines.add(DISCLAIMER);
        if (String.isNotBlank(supportEmail)) {
            lines.add('Si tienes un problema con tu recibo o tu factura, escríbenos a ' + supportEmail + '.');
        }
        return String.join(lines, '\n');
    }

    /**
     * @description The receipt as an HTML email, laid out like a payment receipt: a blue header, the
     * title, the key data, a summary box, the invoice note, and the contact and legal lines.
     * @param donation the paid donation
     * @param supportEmail the program's support address, or null if none is set up yet
     * @return the HTML
     */
    public static String receiptHtml(Opportunity donation, String supportEmail) {
        String name = greetingName(donation);
        String greeting = name == null ? '¡Hola!' : '¡Hola, ' + escape(name) + '!';
        List<String> parts = new List<String>{
            '<!DOCTYPE html><html lang="es"><head>',
            '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            '<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">',
            '<title>Recibo de tu donación</title>',
            // Phones: full-width card and stacked columns. Clients that ignore this still get the desktop layout.
            '<style>@media only screen and (max-width:600px){.card{border-radius:0 !important;}'
                + '.px{padding-left:20px !important;padding-right:20px !important;}'
                + '.col{display:block !important;width:100% !important;padding:0 0 16px 0 !important;}}</style>',
            '</head><body style="margin:0;padding:0;background-color:' + PAGE + ';">',
            // The preview line some email apps show next to the subject.
            '<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">',
            'Gracias por tu donación de ' + money(donation.Amount) + '. Aquí está tu recibo.</div>',
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + PAGE
                + '" style="background-color:' + PAGE + ';"><tr><td align="center" style="padding:32px 12px 48px 12px;">',
            '<table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" '
                + 'style="width:100%;max-width:600px;background-color:#FFFFFF;border-radius:16px;">',
            banner(),
            titleRow(donation),
            textRow('padding:16px 48px 0 48px;text-align:center;font-size:16px;line-height:24px;color:' + BODY + ';',
                greeting + ' Recibimos tu pago correctamente. Gracias a personas como tú, más estudiantes podrán asistir a Mexico Dreamin 2026.'),
            dataRow(donation),
            summaryRow(donation)
        };
        if (donation.Invoice_Requested__c) {
            parts.add(invoiceNoteRow(donation));
        }
        parts.add(dividerRow());
        parts.add(contactRow(supportEmail));
        parts.add(dividerRow());
        parts.add(legalRow());
        parts.add('</table></td></tr></table></body></html>');
        return String.join(parts, '');
    }

    /**
     * @description The simulated invoice as HTML, to turn into a PDF with Blob.toPdf (US-06 AC3, AC8), in the same
     * style as the receipt email. It is clearly not a tax document: no CFDI and no SAT or third-party service.
     * @param donation the paid donation that asked for an invoice
     * @return the HTML
     */
    // ponytail: name, RFC and person type only; a real CFDI 4.0 also needs tax regime, ZIP code and CFDI use.
    public static String invoiceHtml(Opportunity donation) {
        String amount = escape(money(donation.Amount));
        List<String> parties = new List<String>{
            pdfRow('Emisor', 'Programa de donaciones Mexico Dreamin'),
            pdfRow('Receptor', donorName(donation)),
            pdfRow('RFC', donation.RFC__c)
        };
        return '<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><style>'
            + '@page { size: letter; margin: 0; }'
            + 'body { margin: 0; font-family: Arial Unicode MS, sans-serif; font-size: 11pt; color: ' + BODY + '; }'
            + '.band { background-color: ' + BLUE + '; color: #FFFFFF; text-align: center; padding: 30pt 36pt; }'
            + '.eyebrow { color: #DCE6FF; font-size: 9pt; letter-spacing: 2pt; }'
            + 'h1 { color: #FFFFFF; font-size: 26pt; margin: 8pt 0 4pt 0; }'
            + '.folio { color: #DCE6FF; font-size: 11pt; }'
            + '.pad { padding: 0 48pt; }'
            + '.notice { background-color: ' + TINT + '; border-left: 4pt solid ' + BLUE
            + '; padding: 10pt 12pt; margin: 24pt 0 0 0; font-size: 10pt; }'
            + '.caption { color: ' + MUTED + '; font-size: 8pt; letter-spacing: 1pt; margin: 22pt 0 6pt 0; }'
            + 'table { width: 100%; border-collapse: collapse; }'
            + '.blocks td { width: 33%; vertical-align: top; }'
            + '.value { font-size: 12pt; color: ' + TITLE + '; }'
            + '.box { background-color: ' + PAGE + '; }'
            + '.box td { padding: 8pt 12pt; }'
            + '.box td.r { text-align: right; color: ' + TITLE + '; }'
            + '.box tr.sep td { border-top: 1pt solid ' + LINE + '; font-size: 12pt; color: ' + TITLE + '; }'
            + '.foot { color: ' + MUTED + '; font-size: 8pt; margin: 30pt 0 0 0; }'
            + '</style></head><body>'
            + '<div class="band"><div class="eyebrow">MEXICO DREAMIN 2026</div><h1>Factura</h1>'
            + '<div class="folio">Folio #' + escape(donation.Donation_Reference__c) + '</div></div>'
            + '<div class="pad">'
            + '<div class="notice"><b>Este documento no es un comprobante fiscal (CFDI).</b> '
            + 'No fue timbrado ante el SAT y no sirve para deducir impuestos.</div>'
            + '<table class="blocks" style="margin-top: 22pt;"><tr>'
            + pdfBlock('TOTAL', amount) + pdfBlock('FECHA', escape(spanishDate(donation.CloseDate)))
            + pdfBlock('TIPO DE PERSONA', escape(donation.Person_Type__c)) + '</tr></table>'
            + '<div class="caption">EMISOR Y RECEPTOR</div><table class="box">' + String.join(parties, '') + '</table>'
            + '<div class="caption">RESUMEN</div><table class="box">'
            + '<tr><td>Donación · ' + escape(donation.Campaign.Name) + ' × 1</td><td class="r">' + amount + '</td></tr>'
            + '<tr class="sep"><td>Total</td><td class="r">' + amount + '</td></tr></table>'
            + '<p class="foot">Programa de donaciones Mexico Dreamin · '
            + escape(donation.Donation_Reference__c) + '</p></div></body></html>';
    }

    private static String banner() {
        return '<tr><td align="center" bgcolor="' + BLUE + '" style="background-color:' + BLUE
            + ';border-radius:16px 16px 0 0;padding:36px 0;' + FONT + '">'
            + '<div style="width:56px;height:56px;line-height:56px;border-radius:28px;background-color:#FFFFFF;color:' + BLUE
            + ';font-size:28px;font-weight:bold;text-align:center;margin:0 auto;">&#10003;</div>'
            + '<div style="padding-top:14px;font-size:12px;line-height:16px;letter-spacing:2px;text-transform:uppercase;'
            + 'color:#DCE6FF;font-weight:bold;">Mexico Dreamin 2026</div></td></tr>';
    }

    private static String titleRow(Opportunity donation) {
        return textRow('padding:32px 48px 0 48px;text-align:center;',
            '<div style="font-size:24px;line-height:32px;color:' + TITLE + ';">¡Gracias por tu donación!</div>'
            + '<div style="font-size:15px;line-height:24px;color:' + MUTED + ';padding-top:4px;">Recibo #'
            + escape(donation.Donation_Reference__c) + '</div>');
    }

    // The key data in a row (it stacks on phones), and the donor's name below unless the donation is anonymous.
    private static String dataRow(Opportunity donation) {
        String content = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
            + dataBlock('Monto pagado', money(donation.Amount), '34%')
            + dataBlock('Fecha', spanishDate(donation.CloseDate), '33%')
            + dataBlock('Tipo de donación', donation.Donation_Type__c, '33%')
            + '</tr></table>';
        if (!donation.Is_Anonymous__c) {
            content += '<div style="height:16px;line-height:16px;font-size:1px;">&nbsp;</div>'
                + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
                + dataBlock('Donante', donorName(donation), '100%') + '</tr></table>';
        }
        return textRow('padding:28px 48px 0 48px;', content);
    }

    private static String dataBlock(String label, String value, String width) {
        return '<td class="col" valign="top" width="' + width + '" style="padding:0 12px 0 0;' + FONT + '">'
            + '<div style="font-size:12px;line-height:16px;font-weight:bold;text-transform:uppercase;color:' + MUTED + ';">'
            + label + '</div><div style="font-size:15px;line-height:24px;color:' + BODY + ';">' + escape(value) + '</div></td>';
    }

    private static String summaryRow(Opportunity donation) {
        String amount = escape(money(donation.Amount));
        String textStyle = 'font-size:15px;line-height:24px;color:' + BODY + ';';
        return textRow('padding:28px 48px 0 48px;',
            '<div style="font-size:12px;line-height:16px;font-weight:bold;text-transform:uppercase;color:' + MUTED
            + ';padding-bottom:8px;">Resumen</div>'
            + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + PAGE
            + '" style="background-color:' + PAGE + ';border-radius:8px;"><tr><td style="padding:16px;">'
            + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
            + '<tr><td style="padding-bottom:12px;' + textStyle + '">Donación · ' + escape(donation.Campaign.Name) + ' × 1</td>'
            + '<td align="right" valign="top" style="padding:0 0 12px 12px;white-space:nowrap;' + textStyle + '">' + amount + '</td></tr>'
            + '<tr><td colspan="2" height="1" bgcolor="' + LINE + '" style="font-size:1px;line-height:1px;">&nbsp;</td></tr>'
            + '<tr><td style="padding-top:12px;font-weight:bold;' + textStyle + '">Monto pagado</td>'
            + '<td align="right" style="padding:12px 0 0 12px;font-weight:bold;white-space:nowrap;' + textStyle + '">' + amount + '</td></tr>'
            + '</table></td></tr></table>');
    }

    private static String invoiceNoteRow(Opportunity donation) {
        return textRow('padding:24px 48px 0 48px;',
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
            + '<td style="background-color:' + TINT + ';border-left:4px solid ' + BLUE + ';border-radius:6px;padding:14px 16px;'
            + 'font-size:14px;line-height:21px;color:' + BODY + ';"><b>Tu factura va adjunta.</b><br>Archivo: '
            + escape(invoiceFileName(donation)) + '. Este documento no es un comprobante fiscal (CFDI).</td></tr></table>');
    }

    private static String dividerRow() {
        return textRow('padding:24px 48px 0 48px;',
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" bgcolor="'
            + LINE + '" style="font-size:1px;line-height:1px;">&nbsp;</td></tr></table>');
    }

    private static String contactRow(String supportEmail) {
        String text = String.isBlank(supportEmail)
            ? 'Conserva este correo como comprobante de tu donación.'
            : '¿Tienes preguntas sobre tu recibo o tu factura? Escríbenos a <a href="mailto:' + escape(supportEmail)
                + '" style="color:' + BLUE + ';font-weight:bold;text-decoration:none;">' + escape(supportEmail) + '</a>.';
        return textRow('padding:24px 48px 0 48px;font-size:16px;line-height:24px;color:#414552;', text);
    }

    private static String legalRow() {
        return textRow('padding:24px 48px 40px 48px;font-size:12px;line-height:16px;color:' + MUTED + ';',
            DISCLAIMER + ' Recibes este correo porque hiciste una donación al programa de Mexico Dreamin 2026 con esta dirección de correo electrónico.');
    }

    // The px class lets phones shrink the side gutters.
    private static String textRow(String style, String content) {
        return '<tr><td class="px" style="' + style + FONT + '">' + content + '</td></tr>';
    }

    private static String pdfRow(String label, String value) {
        return '<tr><td style="color: ' + MUTED + ';">' + label + '</td><td class="r">' + escape(value) + '</td></tr>';
    }

    private static String pdfBlock(String label, String value) {
        return '<td><div class="caption" style="margin-top: 0;">' + label + '</div><div class="value">' + value + '</div></td>';
    }

    // Anonymous donations get no name; companies are greeted by name, people by first name.
    private static String greetingName(Opportunity donation) {
        if (donation.Is_Anonymous__c) {
            return null;
        }
        if (String.isNotBlank(donation.Donor_Company__c)) {
            return donation.Donor_Company__c;
        }
        return String.isBlank(donation.Donor_First_Name__c) ? null : donation.Donor_First_Name__c;
    }

    private static String donorName(Opportunity donation) {
        if (String.isNotBlank(donation.Donor_Company__c)) {
            return donation.Donor_Company__c;
        }
        return ((donation.Donor_First_Name__c ?? '') + ' ' + (donation.Donor_Last_Name__c ?? '')).trim();
    }

    // Always two decimals and a comma every three digits, whatever the locale of the user who sends the email
    // (Decimal.format() drops trailing zeros: 500.00 would show as $500).
    private static String amountText(Decimal amount) {
        String fixed = String.valueOf((amount ?? 0).setScale(2));
        String whole = fixed.substringBefore('.');
        String grouped = '';
        while (whole.length() > 3) {
            grouped = ',' + whole.right(3) + grouped;
            whole = whole.left(whole.length() - 3);
        }
        return '$' + whole + grouped + '.' + fixed.substringAfter('.');
    }

    private static String money(Decimal amount) {
        return amountText(amount) + ' MXN';
    }

    private static String spanishDate(Date value) {
        return value == null ? '' : value.day() + ' de ' + MONTHS[value.month() - 1] + ' de ' + value.year();
    }

    private static String escape(String value) {
        return (value ?? '').escapeHtml4();
    }
}
