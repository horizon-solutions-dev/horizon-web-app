import './InfoCard.scss';

interface InfoCardProps {
  title?: string;
  description?: string;
  time?: string;
  imageUrl?: string;

  showTitle?: boolean;
  showDescription?: boolean;
  showTime?: boolean;
  showImage?: boolean;
  showIcon?: boolean;

  onClick?: () => void;
}

export const InfoCard = ({
  title = 'Fats that keep you full',
  description = 'Avocado-based meals for steady energy',
  time = '4 min',
  imageUrl = 'https://images.unsplash.com/photo-1592928302636-52b8c49a6b6f',

  showTitle = true,
  showDescription = true,
  showTime = true,
  showImage = true,
  showIcon = true,

  onClick,
}: InfoCardProps) => {
  return (
    <div className="info-card" onClick={onClick}>
      <div className="info-card-content">
        {showTitle && <h3>{title}</h3>}
        {showDescription && <p>{description}</p>}

        {showTime && (
          <div className="info-card-time">
            {showIcon && <span className="icon">⏱</span>}
            <span>{time}</span>
          </div>
        )}
      </div>

      {showImage && (
        <div
          className="info-card-image"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}
    </div>
  );
};
