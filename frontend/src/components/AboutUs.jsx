import styles from "./AboutUs.module.css";

export default function AboutUs() {
	const valores = [
		"Compromiso",
		"Seguridad",
		"Puntualidad",
		"Innovacion",
		"Confianza",
        "Atención",
	];

	return (
		<section className={styles.about}>
			<div className={styles.container}>
				<h2 className={styles.title}>Sobre nosotros</h2>
				<div className={styles.hero}>
					<div className={styles.heroImage} aria-hidden="true" />
					<div className={styles.heroCopy}>
						<h3 className={styles.heroTitle}>Conectando distancias</h3>
						<p className={styles.heroText}>
							En SkyShip Express nacimos con una premisa clara: hacer que las
							fronteras desaparezcan. Somos un equipo de profesionales en ingenieria y
							logistica, apasionados por optimizar cadenas de suministro y brindar un
							servicio al cliente impecable.
						</p>
					</div>
				</div>
				<div className={styles.cards}>
					<article className={styles.card}>
						<h3 className={styles.cardTitle}>Nuestra mision</h3>
						<p className={styles.cardText}>
							Brindar soluciones logisticas integrales y eficientes que superen las
							expectativas de nuestros clientes, conectando empresas y personas a
							traves de un servicio rapido, confiable y seguro en toda la region.
						</p>
					</article>
					<article className={styles.card}>
						<h3 className={styles.cardTitle}>Nuestra vision</h3>
						<p className={styles.cardText}>
							Convertirnos en el socio logistico de referencia a nivel continental,
							reconocidos por nuestra innovacion tecnologica, nuestra red de
							distribucion agil y nuestro estricto compromiso con la excelencia
							operativa.
						</p>
					</article>
				</div>
				<div className={styles.values}>
					<h3 className={styles.valuesTitle}>Nuestros valores</h3>
					<div className={styles.valuesGrid}>
						{valores.map((valor) => (
							<div key={valor} className={styles.valueItem}>
								<span className={styles.valueText}>{valor}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
