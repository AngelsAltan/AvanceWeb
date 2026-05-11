import Button from "./Button";
import styles from "./Hero.module.css";

const fotosSlider = [
	"https://images.unsplash.com/photo-1623577504057-b8270ae82ba4?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	"https://plus.unsplash.com/premium_photo-1681426728047-2164a00fe3dc?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	"https://images.unsplash.com/photo-1617909517211-c4e4275bf5b6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

const Hero = () => {
	return (
		<section className={styles.hero}>
			<div className={styles.slider}>
				{fotosSlider.map((foto, index) => (
					<div
						key={foto}
						className={styles.slide}
						style={{
							backgroundImage: `url('${foto}')`,
							animationDelay: `${index * 5}s`,
						}}
					/>
				))}
			</div>
			<div className={styles.overlay} />
			<div className={styles.content}>
				<div className={styles.copy}>
					<p className={styles.title}>
						SkyShip Express
					</p>
					<p className={styles.subtitle}>
						Conectamos personas y empresas a traves de envios nacionales e internacionales con
						entrega garantizada.
					</p>
				</div>
				<div>
					<Button href="#pricing">COTIZA Y ENVÍA</Button>
				</div>
			</div>
		</section>
	);
};

export default Hero;
