import styles from './Profile.module.css'

const ProfileInfo = () => {
	return (
		<div className={styles.content_main_card}>
                    <img src='https://pbs.twimg.com/profile_images/1954804795828785152/Vmx_KtOP_400x400.jpg'/>
                    <div className={styles.content_text}>
                        <div>
                            <b>Maftuna Vohidjonovna</b>
                            <p>Chemical and Materials Engineer doing her research on quantum computers alongside her IT projects as she loves coding</p>
                        </div>
                    </div>
                </div>
	)
}
export default ProfileInfo
