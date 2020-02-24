import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link, withRouter } from "react-router-dom";
import './App.css';
import './Hamburger.css';
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
      if(imgs[0] && imgs[0].getAttribute('data-src')) {
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
          <div className="col-md-4">
            <div className="mt-5 mb-5 ml-3">
              <Link className="d-block mb-3 out-link" to="/gallery">
                <hr className="line"/>
                <img alt="gallery" height="500" src="gallery.png" className="mr-4"></img>
                <h3 className="d-inline">Gallery</h3>
                <hr className="line"/>
              </Link>
            </div>
            <div className="mt-5 mb-5 ml-3">
              <Link className="d-block mb-3 out-link" to="/store">
                <hr className="line"/>
                <img alt="store" height="500" src="store.png" className="mr-4"></img>
                <h3 className="d-inline">Store</h3>
                <hr className="line"/>
              </Link>
            </div>
            <div className="mt-5 mb-5 ml-3">
              <a className="d-block mb-3 out-link" href="https://kathrinswobodaphotography.foxycart.com/cart?cart=view">
                <hr className="line"/>
                <img alt="cart" height="500" src="cart.png" className="mr-4"></img>
                <h3 className="d-inline">Cart</h3>
                <hr className="line"/>
              </a>
            </div>
          </div>
          <div className="col-md-4">
            <div className="mt-5 mb-5 ml-3">
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
          <div className="col-md-4">
            <div className="mt-5 mb-5 ml-3">
              <div className="d-block">
                <a className="d-block mb-3 out-link" target="_blank" rel="noopener noreferrer" href="https://shotkit.com/kathrin-swoboda/">
                  <hr className="line"/>
                  <img alt="shotkit" src="shotkit.jpg" className="mr-4"></img>
                  <h3 className="d-inline">ShotKit</h3>
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

class PhotoForSale extends Component {
  constructor (props) {
    super(props);

    this.state = {
      price: this.props.options[0].price,
      category: this.props.options[0].category
    };

    this.updateHiddenFields = this.updateHiddenFields.bind(this);
  }

  updateHiddenFields(el) {
    this.setState({
      price: this.props.options[el.currentTarget.selectedIndex].price,
      category: this.props.options[el.currentTarget.selectedIndex].category
    });
  }

  render() {
    return(
      <div className="mb-5 col-sm-12">
        <h5>{this.props.title}</h5>
        <img alt="photoForSale" className="max-height-300" src={this.props.url}/>
        <form name={"photo" + this.props.index} className="form-inline mt-1 justify-content-center" action="https://kathrinswobodaphotography.foxycart.com/cart" method="post">
          <div className="form-group">
            <select className="form-control mr-2" name="size"
              onChange={(el) => this.updateHiddenFields(el)}>
              {this.props.options.map((option, i) =>
                  <option key={i} value={option.name}>
                    {option.name} (${option.price})
                  </option>
              )}
            </select>
            <input type="hidden" name="price" value={this.state.price} />
            <input type="hidden" name="category" value={this.state.category} />
            <input type="hidden" name="name" value={this.props.title} />
            <input type="hidden" name="image" value={this.props.url} />
          </div>
          <input type="submit" className="btn btn-success" value="Add to cart" />
        </form>
      </div>
    )
  }
}

class StorePage extends Component {
  render() {

    const photosForSale = [
      {
        title: "2019 Audubon Grand Prize Winner",
        url: "audobon.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x13 Inch Print", price: "15.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Companion",
        url: "companion.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x13 Inch Print", price: "15.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Bison in Snow",
        url: "bison.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x15 Inch Print", price: "16.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Common Terns Courtship",
        url: "commonterns.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x15 Inch Print", price: "16.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Eastern Bluebird Courtship",
        url: "courtship.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x15 Inch Print", price: "16.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Northern Flicker",
        url: "flicker.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x15 Inch Print", price: "16.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Hummingbird and Pink Flower",
        url: "hummingbird.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x15 Inch Print", price: "16.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Pelican Portrait",
        url: "pelicanportrait.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x15 Inch Print", price: "16.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Tufted Titmouse",
        url: "titmouse.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "10x15 Inch Print", price: "16.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Wait for Me",
        url: "waitforme.jpg",
        options: [
          {name: "8x12 Inch Print", price: "12.99", category: "DEFAULT"},
          {name: "8x12 Inch Standout", price: "52.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Bluebird and Winterberry",
        url: "bluebird.jpg",
        options: [
          {name: "8x10 Inch Print", price: "10.99", category: "DEFAULT"},
          {name: "10x13 Inch Print", price: "15.99", category: "DEFAULT"},
          {name: "8x10 Inch Standout", price: "49.99", category: "DEFAULT"}
        ]
      },
      {
        title: "Smith Island Pelicans",
        url: "pelican.jpg",
        options: [
          {name: "8x10 Inch Print", price: "10.99", category: "DEFAULT"},
          {name: "10x13 Inch Print", price: "15.99", category: "DEFAULT"},
          {name: "8x10 Inch Standout", price: "49.99", category: "DEFAULT"}
        ]
      },
    ];
    return(
      <div className="store">
        <h2>Prints now available from Kathrin Swoboda Photography</h2>
        <p>
          All prints are unsigned and printed on Kodak Endura Lustre.
        </p>
        <p>
          A standout is a lustre print bonded to lightweight foam with a 3/4 inch black finished
          edge with holes in back ready to hang. A beautiful and modern look without a frame or glass.
        </p>
        <p>
          Shipping to USA only. Allow minimum 1 week.
        </p>
        <h2>Photos available for sale:</h2>
        <div className="d-grid-desktop min-2000">
          {photosForSale.map((photo, i) =>
            <PhotoForSale key={i}
                          title={photo.title}
                          url={photo.url}
                          options={photo.options}
                          index={i}/>
          )}
        </div>
      </div>
    );
  }
}

class Hamburger extends Component {

  constructor (props) {
    super(props);
  }

  render() {

    const contact = this.props.location.pathname.includes("/contact");

    return(
      <Link to={contact ? "/" : "/contact"}>
        <button className={"min-75px hamburger hamburger--spring " + (contact ? "is-active" : "") } type="button">
          <span className="hamburger-box">
            <span className="hamburger-inner"></span>
          </span>
        </button>
      </Link>
    );
  }
}

const HamburgerWithRouter = withRouter(Hamburger);

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
              <div className="min-75px">
                <Link to="/"><img alt="logo" src="logo.png" className="col-md-4 d-inline logo pt-3"></img></Link>
              </div>
              <div className="absolute-top-right icon">
                <Link to="/store" className="d-none d-sm-none d-md-inline mr-3 orange-red">Prints now available!</Link>
                <a className="mr-3 d-none d-sm-none d-md-inline" href="https://kathrinswobodaphotography.foxycart.com/cart?cart=view">
                  <img alt="cart" src="cart.png" className="width-50px"></img>
                </a>
                <HamburgerWithRouter />
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
