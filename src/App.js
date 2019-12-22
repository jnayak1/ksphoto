import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import './App.css';
import AWS from 'aws-sdk';
import Masonry from "masonry-layout";
import Carousel from 'react-bootstrap/Carousel';
import Button from "react-bootstrap/Button";
import Fade from 'react-reveal/Fade';
import Zoom from 'react-reveal/Zoom';

class CarouselWrapper extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      currentImageIndex: props.currentImageIndex,
      imgUrls: [],
      path: props.path,
      class: props.className
    };

    this.getImages = this.getImages.bind(this);
    this.slide = this.slide.bind(this);
  }

  componentDidMount() {
    this.getImages();
  }

  getImages() {
    var _this = this;

    return new Promise(function(resolve, reject){
      var s3 = new AWS.S3({apiVersion: "2006-03-01"});

      var bucketParams = {
        Bucket : "kswoboda-photos"
      };
      var images = [];

      s3.makeUnauthenticatedRequest("listObjects", bucketParams, function(err, data) {
        if (err) {
          console.log("Error", err);
          reject(images);
        } else {
          data.Contents.forEach(function(obj){
            if(obj.Key.length > 8 && obj.Key.startsWith(_this.state.path)){
              images.push("https://dw48ipbmbxuns.cloudfront.net/" + obj.Key);
              _this.setState({
                imgUrls: images
              });
            }
          });
          resolve(images);
        }
      });
    });
  }

  slide(eventKey, direction, event) {
    this.setState({
      currentImageIndex: eventKey
    });
    var imgs = document.getElementsByClassName("image-slide");
    if(imgs[eventKey] !== undefined && imgs[eventKey].getAttribute('data-src')) {
      imgs[eventKey].setAttribute('src', imgs[eventKey].getAttribute('data-src'));
      imgs[eventKey].removeAttribute('data-src');
    }
  }

  render() {
    return (
      <Fade>
        <div className={"col-sm-12 " + this.props.className}>
          <Carousel onSelect={this.slide} activeIndex={this.state.currentImageIndex}
            prevIcon={<div className="black-arrow">&#8678;</div>} nextIcon={<div className="black-arrow">&#8680;</div>} pauseOnHover={false}
            indicators={false} interval={3000}>
            {this.state.imgUrls.map((url, i) =>
              <Carousel.Item key={i}>
                <img
                  className={"lazy d-block center image-slide " + this.props.imageClassName}
                  src="loading.gif"
                  data-src={url}
                  alt="slide"/>
              </Carousel.Item>)}
          </Carousel>
        </div>
      </Fade>
    );
  }
}

class Gallery extends Component {

  constructor (props) {
    super(props);
    this.myRef = React.createRef();

    this.state = {
      imgUrls: [],
      currentImageIndex: 0,
      carouselOpen: false
    };

    this.getImages = this.getImages.bind(this);
    this.openCarousel = this.openCarousel.bind(this);
    this.closeCarousel = this.closeCarousel.bind(this);
  }

  componentDidMount() {
    var _this = this;
    this.getImages().then(function(images){
      var msnry = new Masonry(".grid", {
        gutter: 20,
        horizontalOrder: true,
        isFitWidth: true
      });
      var gridElement = document.getElementById("gallery-grid");
      for (var i = 0; i < images.length; i++) {
        var img = new Image();
        img.src = images[i];
        img.width = 300;
        img.className = "grid-item";
        img.id = "img" + i;
        img.onclick = function(e) {
          var index = parseInt(this.id.substring(3, this.id.length));
          _this.openCarousel(e, index);
        };
        img.onload = function() {
          gridElement.appendChild(this);
          msnry.appended([this]);
          msnry.layout();
        }
      }
    });
  }

  getImages() {
    var _this = this;

    return new Promise(function(resolve, reject){
      var s3 = new AWS.S3({apiVersion: "2006-03-01"});

      var bucketParams = {
        Bucket : "kswoboda-photos"
      };
      var images = [];

      s3.makeUnauthenticatedRequest("listObjects", bucketParams, function(err, data) {
        if (err) {
          console.log("Error", err);
          reject(images);
        } else {
          data.Contents.forEach(function(obj){
            if(obj.Key.length > 8 && obj.Key.startsWith("gallery/")){
              images.push("https://s3.amazonaws.com/kswoboda-photos-resized/" + obj.Key);
              _this.setState({
                imgUrls: images
              });
            }
          });
          resolve(images);
        }
      });
    });
  }

  openCarousel(event, index) {
    var body = document.querySelector("body");
    body.classList.add("no-scroll");
    this.setState({
      currentImageIndex: index,
      carouselOpen: true
    });
    setTimeout(() => {
      var imgs = document.getElementsByClassName("image-slide");
      if(imgs[index].getAttribute('data-src')) {
        imgs[index].setAttribute('src', imgs[index].getAttribute('data-src'));
        imgs[index].removeAttribute('data-src');
      }
    }, 1000)
  }

  closeCarousel() {
    var body = document.querySelector("body");
    body.classList.remove("no-scroll");
    this.setState({
      currentImageIndex: 0,
      carouselOpen: false
    });
  }

  render() {
    return (
      <div className="">
        <div id="gallery-grid" className="gallery grid">
        </div>
        <GalleryCarousel
          currentImageIndex={this.state.currentImageIndex}
          carouselOpen={this.state.carouselOpen} />
        <Copyright carouselOpen={this.state.carouselOpen} onClick={this.closeCarousel}/>
      </div>
    );
  }
}

class Copyright extends Component {
  render() {
    if(this.props.carouselOpen) {
      return (
        <div className="fixed-bottom-right" onClick={this.props.onClick}>
          <p className="color-white float-left margin-20">© 2019 Kathrin Swoboda Photography</p>
          <Button className="btn btn-secondary ml-3 float-right margin-20">Close</Button>
        </div>
      );
    }
    return null;
  }
}

class GalleryCarousel extends Component {

  render() {
    if(this.props.carouselOpen){
      return (
        <div className={this.props.className}>
          <CarouselWrapper path="gallery/" className="full-screen pt-5" imageClass="margin-top-75" currentImageIndex={this.props.currentImageIndex}/>
        </div>
      );
    }
    return null;
  }
}

class HomePage extends Component {

  componentDidMount() {
    setTimeout(() => {
      var imgs = document.getElementsByClassName("image-slide");
      if(imgs[0].getAttribute('data-src')) {
        imgs[0].setAttribute('src', imgs[0].getAttribute('data-src'));
        imgs[0].removeAttribute('data-src');
      }
    }, 500)
  }

  render() {
    return (
      <div className="no-overflow">
        <CarouselWrapper path="home/" imageClassName="smaller-slide"/>
      </div>
    );
  }
}

class Splash extends Component {
  render() {
    return (
      <div className="splash col-sm-12">
        <Zoom delay={500}>
          <img className="splash-photo" src="hummingbirds_circle.jpg"/>
        </Zoom>
      </div>
    );
  }
}

class GalleryPage extends Component {

  render() {
    return (
      <div>
        <Gallery/>
      </div>
    );
  }
}

class ContactPage extends Component {
  render() {
    return(
      <Zoom>
        <div className="row">
          <div className="col-md-6">
            <div className="m-5">
              <Link className="d-block mb-3 out-link" to="/gallery">
                <hr className="line"/>
                <img alt="gallery" height="500" src="gallery.png" className="mr-4"></img>
                <h3 className="d-inline">Gallery</h3>
                <hr className="line"/>
              </Link>
            </div>
            <div className="m-5">
              <Link className="d-block mb-3 out-link" to="/store">
                <hr className="line"/>
                <img alt="store" height="500" src="store.png" className="mr-4"></img>
                <h3 className="d-inline">Store</h3>
                <hr className="line"/>
              </Link>
            </div>
            <div className="m-5">
              <a className="d-block mb-3 out-link" href="https://kathrinswobodaphotography.foxycart.com/cart?cart=view">
                <hr className="line"/>
                <img alt="cart" height="500" src="cart.png" className="mr-4"></img>
                <h3 className="d-inline">Cart</h3>
                <hr className="line"/>
              </a>
            </div>
          </div>
          <div className="col-md-6">
            <div className="m-5">
              <div className="d-block">
                <a className="d-block mb-3 out-link" target="_blank" href="mailto:kswoboda2421@gmail.com">
                  <hr className="line"/>
                  <img alt="email" src="email.png" className="mr-4"></img>
                  <h3 className="d-inline">Email</h3>
                  <hr className="line"/>
                </a>
                <a className="d-block mb-3 out-link" target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/KathrinSwobodaPhotography">
                  <hr className="line"/>
                  <img alt="facebook" src="facebook.png" className="mr-4"></img>
                  <h3 className="d-inline">Facebook</h3>
                  <hr className="line"/>
                </a>
                <a className="d-block mb-3 out-link" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/novanature/?hl=en">
                  <hr className="line"/>
                  <img alt="instagram" src="instagram.png" className="mr-4"></img>
                  <h3 className="d-inline">Instagram</h3>
                  <hr className="line"/>
                </a>
                <a className="d-block mb-3 out-link" target="_blank" rel="noopener noreferrer" href="https://www.flickr.com/photos/artinnature/">
                  <hr className="line"/>
                  <img alt="flickr" src="flickr.png" className="mr-4"></img>
                  <h3 className="d-inline">Flickr</h3>
                  <hr className="line"/>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Zoom>
     );
  }
}

class StorePage extends Component {
  render() {
    return(
      <div className="row">
        <div className="col-xl-8">
          <h2>Prints now available from Kathrin Swoboda Photography</h2>
          <p>
            All prints are unsigned and printed on Kodak Lustre Endura or Fuji Lustre Professional
            Paper depending on product. Prices subject to change at any time.
          </p>
          <p>
            Shipping to USA only. Allow minimum 1 week, shipping can be delayed by circumstances not
            under my control. Production 1-2 days.
          </p>
          <h2>Photos available for sale:</h2>
          <div>
            <h5>2019 Audobon Grand Prize Winner</h5>
            <img alt="audobon" className="height-500 mb-5" src="audobon.jpg"/>
            <h5>Companion Piece</h5>
            <img alt="companion" className="height-500 mb-5" src="companion.jpg"/>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="sticky-top mb-5">
            <h2>Order Form:</h2>
            <form className="ml-3" action="https://kathrinswobodaphotography.foxycart.com/cart" method="post">
              <div className="d-block form-group">
                <label className="mr-2">Select Photo:</label>
                <select className="form-control" name="name">
                  <option value="2019 Audobon Grand Prize Winner">2019 Audobon Grand Prize Winner</option>
                  <option value="Companion Piece">Companion Piece</option>
                </select>
              </div>
              <div className="d-block form-group">
                <label className="mr-2">Select Option:</label>
                <select className="form-control">
                  <option value="print">Print</option>
                </select>
              </div>
              <div className="d-block form-group">
                <label className="mr-2">Select Size:</label>
                <select className="form-control" name="size">
                  <option value="8x12 inches">8x12 inches</option>
                  <option value="10x13 inches">10x13 inches</option>
                </select>
              </div>
              <p className="mb-0">Price: $12.00 each</p>
              <p>Shipping: $7.00</p>
              <input type="hidden" name="price" value="12.00" />
              <input type="submit" className="btn btn-success" value="Add to cart" />
            </form>
          </div>
        </div>
      </div>
    );
  }
}


class App extends Component {

  constructor (props) {
    super(props);

    this.state = {
      loading: true
    };

    this.fadeOutEffect = this.fadeOutEffect.bind(this);
  }


  componentDidMount() {
    setTimeout(() => this.setState({ loading: false }), 6500);
    setTimeout(this.fadeOutEffect, 6250);
  }

  fadeOutEffect() {
    var fadeTarget = document.getElementById("logo-fade");
    var fadeEffect = setInterval(function () {
      if (!fadeTarget.style.opacity) {
        fadeTarget.style.opacity = 1;
      }
      if (fadeTarget.style.opacity > 0) {
        fadeTarget.style.opacity -= 0.1;
      } else {
        clearInterval(fadeEffect);
      }
    }, 25);
  }

  render() {
    const { loading } = this.state;

    if (loading) {
      return(
        <div className={loading ? "" : "none"}>
          <div id="logo-fade" className="img-container">
            <img src="white.gif" className="center-vertical translucent"/>
          </div>
        </div>
      );
    } else {
      return(
        <div className="container-fluid">
          <Router>
            <div>
              <Link to="/"><img alt="logo" src="logo.png" className="col-md-4 d-inline logo pt-3"></img></Link>
              <div className="float-right text-right icon">
                <Link to="/contact"><img alt="contact" src="hamburger.png" className="mr-5 change-width"></img></Link>
              </div>
              <Route exact path="/" component={HomePage} />
              <Route path="/gallery" component={GalleryPage} />
              <Route path="/store" component={StorePage} />
              <Route path="/contact" component={ContactPage} />
            </div>
          </Router>
        </div>
      );
    }
  }
}

export default App;
