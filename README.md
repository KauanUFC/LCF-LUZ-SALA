# LCF-LUZ-SALA 💡

Projeto voluntário de automatização da iluminação do Laboratório de Computação Física do Curso de SMD da UFC.

## 📌 Sobre o Projeto

O sistema visa otimizar o consumo energético e proporcionar maior comodidade à equipe técnica. Atualmente, a gestão da iluminação é manual, o que frequentemente resulta em luzes acesas desnecessariamente, exigindo deslocamentos evitáveis dos técnicos para o desligamento dos equipamentos.

## 🛠️ Especificações Técnicas

Em sua fase inicial, o projeto está sendo testado no Laboratório de Computação Física com as seguintes tecnologias:

- **Hardware:** Microcontrolador ESP32 WROOM 32U e módulos de relés.
- **Interface:** Controle realizado via Web Server integrado ao ESP32.
- **Manutenção:** Integração com **ElegantOTA** para atualizações remotas de firmware, garantindo maior agilidade na manutenção sem a necessidade de conexão física.

## 🚀 Escalabilidade

Embora a implementação atual seja focada em iluminação, a arquitetura do sistema é escalável. O uso de relés permite que a solução seja expandida para o controle de diversos outros dispositivos, como:
- Ventiladores e exaustores;
- Bombas d'água;
- Fechaduras eletrônicas e outros atuadores.

## 🗺️ Roadmap (Próximos Passos)

- [ ] **Frontend:** Melhorar a UI (Interface do Usuário) do Web Server do firmware do ESP32.
- [ ] **Backend:** Desenvolver plataforma de gestão em `TypeScript` + `Fastify` + `PostgreSQL` (projeto satélite).
- [ ] **Comunicação:** Refinar a implementação de protocolos `MQTT` e `APIs`.

## 💬 Feedback

Dicas e sugestões para a melhoria do projeto são sempre bem-vindas! Se tiver alguma ideia ou dúvida, entre em contato comigo:

- 📧 Email: [hawkkauan@gmail.com]

## ⚠️ Aviso de Segurança

Devido à natureza do projeto, que envolve a manipulação de **energia alternada (220V)** e impacto direto na infraestrutura física do laboratório, as alterações de código são restritas. 

Para garantir a segurança dos usuários e a integridade dos equipamentos, **não estão sendo aceitos Pull Requests externos**. No entanto, sugestões e feedbacks via *Issues* são muito bem-vindos e serão analisados para implementação manual.
