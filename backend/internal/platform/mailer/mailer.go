package mailer

import (
	"fmt"
	"net/smtp"

	"thiagoxchange/backend/internal/config"
)

type Mailer struct {
	cfg config.Config
}

func New(cfg config.Config) Mailer {
	return Mailer{cfg: cfg}
}

func (m Mailer) Send(to, subject, body string) error {
	if m.cfg.SMTPUser == "" || m.cfg.SMTPPass == "" {
		return nil
	}
	auth := smtp.PlainAuth("", m.cfg.SMTPUser, m.cfg.SMTPPass, m.cfg.SMTPHost)
	from := fmt.Sprintf("%s <%s>", m.cfg.SMTPFrom, m.cfg.SMTPUser)
	msg := []byte("From: " + from + "\r\nTo: " + to + "\r\nSubject: " + subject + "\r\n\r\n" + body)
	return smtp.SendMail(m.cfg.SMTPHost+":"+m.cfg.SMTPPort, auth, m.cfg.SMTPUser, []string{to}, msg)
}
