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
                  className={"d-block center image-slide " + this.props.imageClassName}
                  src={url}
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
        <div className="fixed-top-right" onClick={this.props.onClick}>
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
        <div className="m-5">
          <div className="d-block">
            <a className="d-block mb-3 out-link" href="mailto:kswoboda2421@gmail.com">
              <hr className="line"/>
              <img alt="email" src="email.png" className="mr-4"></img>
              <h3 className="d-inline">Email kswoboda2421@gmail.com</h3>
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
      </Zoom>
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
              <Link to="/"><img alt="logo" src="logo.png" className="col-md-4 logo pt-3"></img></Link>
              <div className="float-right icon">
                <Link to="/contact"><img alt="contact" src="contact.png" className="mr-5 change-width"></img></Link>           
                <Link to="/gallery"><img alt="gallery" src="gallery.png" className="change-width"></img></Link>
              </div>
              <Route exact path="/" component={HomePage} />
              <Route path="/gallery" component={GalleryPage} />
              <Route path="/contact" component={ContactPage} />
            </div>
          </Router>
        </div>
      );
    }
  }
}

export default App;
